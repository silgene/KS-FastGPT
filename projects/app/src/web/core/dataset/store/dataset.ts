import { create, devtools, persist, immer } from '@fastgpt/web/common/zustand';
import type { DatasetListItemType } from '@fastgpt/global/core/dataset/type.d';
import { getDatasets } from '@/web/core/dataset/api';

type State = {
  myDatasets: DatasetListItemType[];
  loadMyDatasets: (spaceId: string, parentId?: string) => Promise<DatasetListItemType[]>;
};
// 这个datasetStore不知道是做什么的，没有任何引用...
export const useDatasetStore = create<State>()(
  devtools(
    persist(
      immer((set, get) => ({
        myDatasets: [],
        async loadMyDatasets(parentId = '', spaceId = '') {
          const res = await getDatasets({ parentId, spaceId });
          set((state) => {
            state.myDatasets = res;
          });
          return res;
        }
      })),
      {
        name: 'datasetStore',
        partialize: (state) => ({})
      }
    )
  )
);
