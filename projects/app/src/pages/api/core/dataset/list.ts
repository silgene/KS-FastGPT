import { type DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
// import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { NextAPI } from '@/service/middleware/entry';
import { DatasetPermission } from '@fastgpt/global/support/permission/dataset/controller';
import {
  // PerResourceTypeEnum,
  ReadPermissionVal
} from '@fastgpt/global/support/permission/constant';
// import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
// import { DatasetDefaultPermissionVal } from '@fastgpt/global/support/permission/dataset/constant';
import { type ParentIdType } from '@fastgpt/global/common/parentFolder/type';
import { parseParentIdInMongo } from '@fastgpt/global/common/parentFolder/utils';
import { type ApiRequestProps } from '@fastgpt/service/type/next';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { replaceRegChars } from '@fastgpt/global/common/string/tools';
// import { getGroupsByTmbId } from '@fastgpt/service/support/permission/memberGroup/controllers';
// import { concatPer } from '@fastgpt/service/support/permission/controller';
// import { getOrgIdSetWithParentByTmbId } from '@fastgpt/service/support/permission/org/controllers';
import { addSourceMember } from '@fastgpt/service/support/user/utils';
import { getEmbeddingModel } from '@fastgpt/service/core/ai/model';
import { SpaceDatasetReadPermissionVal } from '@fastgpt/global/support/permission/space/constant';
import { authSpace } from '@fastgpt/service/support/permission/space/auth';
import { SpacePerToDatasetPer } from '@fastgpt/global/support/permission/space/controller';

export type GetDatasetListBody = {
  parentId: ParentIdType;
  type?: DatasetTypeEnum;
  searchKey?: string;
  spaceId: string;
};

async function handler(req: ApiRequestProps<GetDatasetListBody>) {
  const { parentId, type, searchKey, spaceId } = req.body;

  // Auth space permission
  const [{ tmbId, teamId, permission: spacePer }] = await Promise.all([
    authSpace({ spaceId, per: SpaceDatasetReadPermissionVal, authToken: true, req }),
    ...(parentId
      ? [
          authDataset({
            req,
            authToken: true,
            authApiKey: true,
            per: ReadPermissionVal,
            datasetId: parentId
          })
        ]
      : [])
  ]);

  // // Get team all dataset permissions
  // const [perList, myGroupMap, myOrgSet] = await Promise.all([
  //   MongoResourcePermission.find({
  //     resourceType: PerResourceTypeEnum.dataset,
  //     teamId,
  //     resourceId: {
  //       $exists: true
  //     }
  //   }).lean(),
  //   getGroupsByTmbId({
  //     tmbId,
  //     teamId
  //   }).then((item) => {
  //     const map = new Map<string, 1>();
  //     item.forEach((item) => {
  //       map.set(String(item._id), 1);
  //     });
  //     return map;
  //   }),
  //   getOrgIdSetWithParentByTmbId({
  //     teamId,
  //     tmbId
  //   })
  // ]);
  // const myPerList = perList.filter(
  //   (item) =>
  //     String(item.tmbId) === String(tmbId) ||
  //     myGroupMap.has(String(item.groupId)) ||
  //     myOrgSet.has(String(item.orgId))
  // );

  const findDatasetQuery = (() => {
    // 简化查询逻辑，类似应用列表的处理方式
    const datasetPerQuery = spacePer.isOwner
      ? {}
      : parentId
        ? {
            $or: [parseParentIdInMongo(parentId)]
          }
        : { $or: [{ parentId: null }] };

    const searchMatch = searchKey
      ? {
          $or: [
            { name: { $regex: new RegExp(`${replaceRegChars(searchKey)}`, 'i') } },
            { intro: { $regex: new RegExp(`${replaceRegChars(searchKey)}`, 'i') } }
          ]
        }
      : {};

    if (searchKey) {
      return {
        ...datasetPerQuery,
        teamId,
        spaceId,
        ...searchMatch
      };
    }

    return {
      ...datasetPerQuery,
      teamId,
      spaceId,
      ...(type ? (Array.isArray(type) ? { type: { $in: type } } : { type }) : {}),
      ...parseParentIdInMongo(parentId)
    };
  })();

  const myDatasets = await MongoDataset.find(findDatasetQuery)
    .sort({
      updateTime: -1
    })
    .lean();

  const formatDatasets = myDatasets
    .map((dataset) => {
      // const { Per, privateDataset } = (() => {
      //   const getPer = (datasetId: string) => {
      //     const tmbPer = myPerList.find(
      //       (item) => String(item.resourceId) === datasetId && !!item.tmbId
      //     )?.permission;
      //     const groupPer = concatPer(
      //       myPerList
      //         .filter(
      //           (item) => String(item.resourceId) === datasetId && (!!item.groupId || !!item.orgId)
      //         )
      //         .map((item) => item.permission)
      //     );
      //     return new DatasetPermission({
      //       per: tmbPer ?? groupPer ?? DatasetDefaultPermissionVal,
      //       isOwner: String(dataset.tmbId) === String(tmbId) || teamPer.isOwner
      //     });
      //   };
      //   const getClbCount = (datasetId: string) => {
      //     return perList.filter((item) => String(item.resourceId) === String(datasetId)).length;
      //   };

      //   // inherit
      //   if (
      //     dataset.inheritPermission &&
      //     dataset.parentId &&
      //     dataset.type !== DatasetTypeEnum.folder
      //   ) {
      //     return {
      //       Per: getPer(String(dataset.parentId)),
      //       privateDataset: getClbCount(String(dataset.parentId)) <= 1
      //     };
      //   }
      //   return {
      //     Per: getPer(String(dataset._id)),
      //     privateDataset:
      //       dataset.type === DatasetTypeEnum.folder
      //         ? getClbCount(String(dataset._id)) <= 1
      //         : getClbCount(String(dataset._id)) === 0
      //   };
      // })();

      const getPer = () => {
        if (String(dataset.tmbId) === String(tmbId) || spacePer.isOwner) {
          return new DatasetPermission({ isOwner: true });
        }
        // 根据空间权限转换为知识库权限
        return SpacePerToDatasetPer(spacePer.value);
      };

      return {
        _id: dataset._id,
        avatar: dataset.avatar,
        name: dataset.name,
        intro: dataset.intro,
        type: dataset.type,
        vectorModel: getEmbeddingModel(dataset.vectorModel),
        inheritPermission: dataset.inheritPermission,
        tmbId: dataset.tmbId,
        updateTime: dataset.updateTime,
        permission: getPer(),
        private: false // 简化私有状态判断
      };
    })
    .filter((dataset) => dataset.permission.hasReadPer);

  return addSourceMember({
    list: formatDatasets
  });
}

export default NextAPI(handler);
