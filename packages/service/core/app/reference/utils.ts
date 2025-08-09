import { NodeInputKeyEnum, WorkflowIOValueTypeEnum } from '@fastgpt/global/core/workflow/constants';
import { MongoApp } from '../schema';
import { FlowNodeTypeEnum } from '@fastgpt/global/core/workflow/node/constant';
import type { ParentIdType } from '@fastgpt/global/common/parentFolder/type';
import { onCreateApp } from '../controller';
import type { StoreNodeItemType } from '@fastgpt/global/core/workflow/type/node';
import { type ClientSession, Types } from 'mongoose';
import type { AppSchema } from '@fastgpt/global/core/app/type';
import type {
  DatasetCollectionSchemaType,
  DatasetDataSchemaType,
  DatasetDataTextSchemaType,
  DatasetSchemaType
} from '@fastgpt/global/core/dataset/type';
import { MongoDataset } from '../../../core/dataset/schema';
import { MongoDatasetCollection } from '../../../core/dataset/collection/schema';
import { MongoDatasetData } from '../../../core/dataset/data/schema';
import { MongoDatasetDataText } from '../../../core/dataset/data/dataTextSchema';
import { getVectorByCollectionId, vectorInsert } from '../../../common/vectorDB/controller';

const dfsFindAppReference = async ({
  appId,
  appSet,
  datasetSet
}: {
  appId: string;
  appSet: Set<string>;
  datasetSet: Set<string>;
}) => {
  const app = await MongoApp.findById(appId).lean();
  if (!app) return;
  const { modules } = app;
  // 防止循环依赖自己,先把自己放入appSet
  appSet.add(appId);
  for (const node of modules) {
    if (
      node.flowNodeType === FlowNodeTypeEnum.appModule ||
      node.flowNodeType === FlowNodeTypeEnum.pluginModule
    ) {
      if (!node.pluginId) continue;
      // 这里的pluginId是指向某个app的,不一定单指插件
      const id = String(node.pluginId);
      if (appSet.has(id)) continue;
      await dfsFindAppReference({
        appId: id,
        appSet,
        datasetSet
      });
    }
    if (node.flowNodeType === FlowNodeTypeEnum.datasetSearchNode) {
      const val = node.inputs.find(
        (input) =>
          input.key === NodeInputKeyEnum.datasetSelectList &&
          input.valueType === WorkflowIOValueTypeEnum.selectDataset
      )?.value as { datasetId: string }[];
      if (val && Array.isArray(val)) {
        val.forEach(({ datasetId }) => {
          if (datasetId && typeof datasetId === 'string') {
            datasetSet.add(datasetId);
          }
        });
      }
    }
  }
};

export const findAppReference = async (params: {
  appId: string;
}): Promise<{
  appDep: string[];
  datasetDep: string[];
}> => {
  const appSet = new Set<string>();
  const datasetSet = new Set<string>();
  await dfsFindAppReference({
    appId: params.appId,
    appSet,
    datasetSet
  });

  return {
    appDep: Array.from(appSet),
    datasetDep: Array.from(datasetSet)
  };
};

// TODO: 可以尝试让前端选择是否重新创建/替换引用
// 复制一个app及其所有的引用
export const createAppReferenceTo = async (params: {
  appId: string;
  spaceId: string;
  tmbId: string;
  parentId: ParentIdType;
  session: ClientSession;
}) => {
  const { appId, spaceId, parentId, session, tmbId } = params;
  // 收集依赖
  const { appDep, datasetDep } = await findAppReference({ appId });
  // 旧id , 新id
  const appMap = new Map<string, string>(
    appDep.map((id) => [id, new Types.ObjectId().toHexString()])
  );
  const datasetMap = new Map<string, string>(
    datasetDep.map((id) => [id, new Types.ObjectId().toHexString()])
  );
  const pendingCreateApp: AppSchema[] = [];
  const pendingCreateDataset: DatasetSchemaType[] = [];
  // 替换app引用
  for (const oldId of appDep) {
    const newId = appMap.get(oldId);
    if (!newId) continue;
    const app = await MongoApp.findById(oldId).lean();
    if (!app) continue;
    const { modules } = app;
    // 替换引用
    for (const node of modules) {
      if (
        node.flowNodeType === FlowNodeTypeEnum.appModule ||
        node.flowNodeType === FlowNodeTypeEnum.pluginModule
      ) {
        if (!node.pluginId) continue;
        const id = String(node.pluginId);
        if (appMap.has(id)) {
          node.pluginId = appMap.get(id);
        }
      } else if (node.flowNodeType === FlowNodeTypeEnum.datasetSearchNode) {
        const val = node.inputs.find(
          (input) =>
            input.key === NodeInputKeyEnum.datasetSelectList &&
            input.valueType === WorkflowIOValueTypeEnum.selectDataset
        )?.value as string[];
        if (val && Array.isArray(val)) {
          val.forEach((datasetId, index) => {
            if (datasetMap.has(datasetId)) {
              val[index] = datasetMap.get(datasetId)!;
            }
          });
        }
      }
    }
    pendingCreateApp.push({
      ...app,
      _id: newId,
      tmbId,
      spaceId,
      parentId,
      modules: modules as StoreNodeItemType[],
      updateTime: new Date()
    });
  }

  // 复制dataset及其数据
  for (let i = 0; i < datasetDep.length; i++) {
    const oldId = datasetDep[i];
    const dataset = await MongoDataset.findById(oldId).lean();
    if (!dataset) continue;
    // 复制集合
    const newDatasetId = datasetMap.get(oldId)!;
    const collections = await MongoDatasetCollection.find({ datasetId: oldId }).lean();
    const pendingCreateCollections: DatasetCollectionSchemaType[] = [];
    const pendingCreateCollectionsData: DatasetDataSchemaType[] = [];
    const pendingCreateCollectionsDataText: DatasetDataTextSchemaType[] = [];
    // 复制集合下的数据
    for (let j = 0; j < collections.length; j++) {
      const collection = collections[j];
      const newCollectionId = new Types.ObjectId().toHexString();
      const vectorIdsMap = new Map<string, string>();
      const vectors = await getVectorByCollectionId(String(collection._id));
      // TODO: 在这里可以考虑批量插入向量数据
      // TODO: 这里的向量数据插入后在函数抛异常时需要删除
      for (const vector of vectors) {
        const { insertId } = await vectorInsert({
          datasetId: newDatasetId,
          collectionId: newCollectionId,
          vector: vector.vector,
          teamId: vector.team_id
        });
        vectorIdsMap.set(vector.id, insertId);
      }

      const collectionData = await MongoDatasetData.find({ collectionId: collection._id }).lean();
      const collectionDataIdsMap = new Map<string, string>(
        collectionData.map((data) => [String(data._id), new Types.ObjectId().toHexString()])
      );
      const collectionDataText = await MongoDatasetDataText.find({
        collectionId: collection._id
      }).lean();
      pendingCreateCollectionsDataText.push(
        ...collectionDataText.map((dataText) => {
          return {
            ...dataText,
            _id: new Types.ObjectId().toHexString(),
            datasetId: newDatasetId,
            collectionId: newCollectionId,
            dataId: collectionDataIdsMap.get(String(dataText.dataId))!
          };
        })
      );
      // 复制collectionData并替换datasetId和collectionId
      pendingCreateCollectionsData.push(
        ...collectionData.map((data) => {
          return {
            ...data,
            indexes: data.indexes.map((idx) => {
              return {
                ...idx,
                // 向量索引
                dataId: vectorIdsMap.get(idx.dataId)!
              };
            }),
            _id: new Types.ObjectId().toHexString(),
            datasetId: newDatasetId,
            collectionId: newCollectionId,
            tmbId,
            updateTime: new Date()
          };
        })
      );
      pendingCreateCollections.push({
        ...collection,
        _id: newCollectionId,
        datasetId: newDatasetId,
        tmbId,
        createTime: new Date(),
        updateTime: new Date()
      });
    }
    await MongoDatasetCollection.insertMany(pendingCreateCollections, { session });
    await MongoDatasetData.insertMany(pendingCreateCollectionsData, { session });
    await MongoDatasetDataText.insertMany(pendingCreateCollectionsDataText, { session });
    pendingCreateDataset.push({
      ...dataset,
      _id: newDatasetId,
      tmbId,
      spaceId,
      updateTime: new Date()
    });
  }
  await MongoDataset.insertMany(pendingCreateDataset, { session });
  await MongoApp.insertMany(pendingCreateApp, { session });
  return appMap.get(appId)!;
};
