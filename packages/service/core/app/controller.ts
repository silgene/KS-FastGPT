import { type AppSchema } from '@fastgpt/global/core/app/type';
import { NodeInputKeyEnum } from '@fastgpt/global/core/workflow/constants';
import { FlowNodeTypeEnum } from '@fastgpt/global/core/workflow/node/constant';
import { MongoApp } from './schema';
import type { StoreNodeItemType } from '@fastgpt/global/core/workflow/type/node';
import { storeSecretValue } from '../../common/secret/utils';
import { parseParentIdInMongo } from '@fastgpt/global/common/parentFolder/utils';
import type { ParentIdType } from '@fastgpt/global/common/parentFolder/type';
import { AppFolderTypeList, type AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { type ClientSession } from 'mongoose';
import { MongoAppVersion } from './version/schema';
import { addOperationLog } from '../../support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
import { getI18nAppType } from '../../support/operationLog/util';
import { refreshSourceAvatar } from '../../common/file/image/controller';
import { mongoSessionRun } from '../../common/mongo/sessionRun';

export const beforeUpdateAppFormat = ({ nodes }: { nodes?: StoreNodeItemType[] }) => {
  if (!nodes) return;

  nodes.forEach((node) => {
    // Format header secret
    node.inputs.forEach((input) => {
      if (input.key === NodeInputKeyEnum.headerSecret && typeof input.value === 'object') {
        input.value = storeSecretValue(input.value);
      }
    });

    // Format dataset search
    if (node.flowNodeType === FlowNodeTypeEnum.datasetSearchNode) {
      node.inputs.forEach((input) => {
        if (input.key === NodeInputKeyEnum.datasetSelectList) {
          const val = input.value as undefined | { datasetId: string }[] | { datasetId: string };
          if (!val) {
            input.value = [];
          } else if (Array.isArray(val)) {
            // Not rewrite reference value
            if (val.length === 2 && val.every((item) => typeof item === 'string')) {
              return;
            }
            input.value = val
              .map((dataset: { datasetId: string }) => ({
                datasetId: dataset.datasetId
              }))
              .filter((item) => !!item.datasetId);
          } else if (typeof val === 'object' && val !== null) {
            input.value = [
              {
                datasetId: val.datasetId
              }
            ];
          }
        }
      });
    }
  });
};

/* Get apps */
export async function findAppAndAllChildren({
  teamId,
  appId,
  fields
}: {
  teamId: string;
  appId: string;
  fields?: string;
}): Promise<AppSchema[]> {
  const find = async (id: string) => {
    const children = await MongoApp.find(
      {
        teamId,
        parentId: id
      },
      fields
    ).lean();

    let apps = children;

    for (const child of children) {
      const grandChildrenIds = await find(child._id);
      apps = apps.concat(grandChildrenIds);
    }

    return apps;
  };
  const [app, childDatasets] = await Promise.all([MongoApp.findById(appId, fields), find(appId)]);

  if (!app) {
    return Promise.reject('Dataset not found');
  }

  return [app, ...childDatasets];
}

export const getAppBasicInfoByIds = async ({ teamId, ids }: { teamId: string; ids: string[] }) => {
  const apps = await MongoApp.find(
    {
      teamId,
      _id: { $in: ids }
    },
    '_id name avatar'
  ).lean();

  return apps.map((item) => ({
    id: item._id,
    name: item.name,
    avatar: item.avatar
  }));
};
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
