import { NextAPI } from '@/service/middleware/entry';
import { WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { TeamAppCreatePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { authTeamPer } from '@fastgpt/service/support/permission/user/auth';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { getI18nAppType } from '@fastgpt/service/support/operationLog/util';
import { authSpaceByTmbId } from '@fastgpt/service/support/permission/space/auth';
import { SpaceAppEditPermissionVal } from '@fastgpt/global/support/permission/space/constant';
import { createAppReferenceTo, findAppReference } from '@fastgpt/service/core/app/reference/utils';
import { onCreateApp } from '@fastgpt/service/core/app/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import type { ParentIdType } from '@fastgpt/global/common/parentFolder/type';
export type copyAppQuery = {};

export type copyAppBody = {
  appId: string;
  spaceId: string;
  parentId?: ParentIdType;
};

export type copyAppResponse = {
  appId: string;
};

async function handler(
  req: ApiRequestProps<copyAppBody, copyAppQuery>,
  res: ApiResponseType<any>
): Promise<copyAppResponse> {
  const { parentId, spaceId } = req.body;
  const { app, teamId, tmbId } = await authApp({
    req,
    authToken: true,
    per: WritePermissionVal,
    appId: req.body.appId
  });
  const { space: targetSpace } = await authSpaceByTmbId({
    tmbId,
    spaceId,
    per: SpaceAppEditPermissionVal
  });

  // const { tmbId } = app.parentId
  //   ? await authApp({ req, appId: app.parentId, per: WritePermissionVal, authToken: true })
  //   : await authTeamPer({ req, authToken: true, per: TeamAppCreatePermissionVal });

  // 如果这个app的spaceId 与 targetSpace的id不同,则需要查找引用,并且需要复制其所有引用到targetSpace
  if (String(app.spaceId) !== String(targetSpace._id)) {
    const newAppId = await mongoSessionRun(async (session) => {
      return createAppReferenceTo({
        appId: app._id,
        spaceId: targetSpace._id,
        tmbId,
        parentId,
        session
      });
    });
    // TODO: 需要在这里添加操作日志
    return { appId: newAppId };
  }

  const appId = await onCreateApp({
    parentId: app.parentId,
    spaceId: targetSpace._id,
    name: app.name + ' Copy',
    intro: app.intro,
    avatar: app.avatar,
    type: app.type,
    modules: app.modules,
    edges: app.edges,
    chatConfig: app.chatConfig,
    teamId: app.teamId,
    tmbId,
    pluginData: app.pluginData
  });

  (async () => {
    addOperationLog({
      tmbId,
      teamId,
      event: OperationLogEventEnum.CREATE_APP_COPY,
      params: {
        appName: app.name,
        appType: getI18nAppType(app.type)
      }
    });
  })();

  return { appId };
}

export default NextAPI(handler);
