import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import type { ParentIdType } from '@fastgpt/global/common/parentFolder/type';
import { parseParentIdInMongo } from '@fastgpt/global/common/parentFolder/utils';
import type { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { AppFolderTypeList } from '@fastgpt/global/core/app/constants';
import type { AppSchema } from '@fastgpt/global/core/app/type';
import { type ShortUrlParams } from '@fastgpt/global/support/marketing/type';
import { WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { TeamAppCreatePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { refreshSourceAvatar } from '@fastgpt/service/common/file/image/controller';
import { pushTrack } from '@fastgpt/service/common/middle/tracks/utils';
import { type ClientSession } from '@fastgpt/service/common/mongo';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { MongoAppVersion } from '@fastgpt/service/core/app/version/schema';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { checkTeamAppLimit } from '@fastgpt/service/support/permission/teamLimit';
import { authTeamPer } from '@fastgpt/service/support/permission/user/auth';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { type ApiRequestProps } from '@fastgpt/service/type/next';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
import { getI18nAppType } from '@fastgpt/service/support/operationLog/util';
import { authSpace } from '@fastgpt/service/support/permission/space/auth';
import { SpaceAppEditPermissionVal } from '@fastgpt/global/support/permission/space/constant';

export type CreateAppBody = {
  parentId?: ParentIdType;
  spaceId: string;
  name?: string;
  avatar?: string;
  type?: AppTypeEnum;
  modules: AppSchema['modules'];
  edges?: AppSchema['edges'];
  chatConfig?: AppSchema['chatConfig'];
  utmParams?: ShortUrlParams;
};

async function handler(req: ApiRequestProps<CreateAppBody>) {
  const { parentId, name, avatar, type, modules, edges, chatConfig, utmParams, spaceId } = req.body;

  if (!name || !type || !Array.isArray(modules)) {
    return Promise.reject(CommonErrEnum.inheritPermissionError);
  }
  // 校验这个tmb是否有权限在这个空间创建app
  const { teamId, tmbId, userId } = await authSpace({
    req,
    spaceId,
    per: SpaceAppEditPermissionVal,
    authToken: true
  });
  // const { teamId, tmbId, userId } = parentId
  //   ? await authApp({ req, appId: parentId, per: WritePermissionVal, authToken: true })
  //   : await authTeamPer({ req, authToken: true, per: TeamAppCreatePermissionVal });

  // 上限校验（先取消）
  // await checkTeamAppLimit(teamId);
  const tmb = await MongoTeamMember.findById({ _id: tmbId }, 'userId').populate<{
    user: { username: string };
  }>('user', 'username');

  // 创建app
  const appId = await onCreateApp({
    parentId,
    spaceId,
    name,
    avatar,
    type,
    modules,
    edges,
    chatConfig,
    teamId,
    tmbId,
    userAvatar: tmb?.avatar,
    username: tmb?.user?.username
  });

  pushTrack.createApp({
    type,
    uid: userId,
    teamId,
    tmbId,
    appId,
    ...utmParams
  });

  return appId;
}

export default NextAPI(handler);

export const onCreateApp = async ({
  parentId,
  spaceId,
  name,
  intro,
  avatar,
  type,
  modules,
  edges,
  chatConfig,
  teamId,
  tmbId,
  pluginData,
  username,
  userAvatar,
  session
}: {
  parentId?: ParentIdType;
  spaceId: string;
  name?: string;
  avatar?: string;
  type?: AppTypeEnum;
  modules?: AppSchema['modules'];
  edges?: AppSchema['edges'];
  chatConfig?: AppSchema['chatConfig'];
  intro?: string;
  teamId: string;
  tmbId: string;
  pluginData?: AppSchema['pluginData'];
  username?: string;
  userAvatar?: string;
  session?: ClientSession;
}) => {
  const create = async (session: ClientSession) => {
    const [{ _id: appId }] = await MongoApp.create(
      [
        {
          ...parseParentIdInMongo(parentId),
          spaceId,
          avatar,
          name,
          intro,
          teamId,
          tmbId,
          modules,
          edges,
          chatConfig,
          type,
          version: 'v2',
          pluginData
        }
      ],
      { session, ordered: true }
    );

    if (!AppFolderTypeList.includes(type!)) {
      await MongoAppVersion.create(
        [
          {
            tmbId,
            appId,
            nodes: modules,
            edges,
            chatConfig,
            versionName: name,
            username,
            avatar: userAvatar,
            isPublish: true
          }
        ],
        { session, ordered: true }
      );
    }
    (async () => {
      addOperationLog({
        tmbId,
        teamId,
        event: OperationLogEventEnum.CREATE_APP,
        params: {
          appName: name!,
          appType: getI18nAppType(type!)
        }
      });
    })();

    await refreshSourceAvatar(avatar, undefined, session);

    return appId;
  };

  if (session) {
    return create(session);
  } else {
    return await mongoSessionRun(create);
  }
};
