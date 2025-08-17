import { useMemo, useState, type ReactNode } from 'react';
import { createContext } from 'use-context-selector';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getTeamMemberCount } from '@/web/support/user/team/api';
import { useUserStore } from '@/web/support/user/useUserStore';
import type { SpaceDetailType } from '@fastgpt/global/support/user/space/type';
import { getAllAccessibleSpaces } from '@/web/support/user/space/api';
import {
  type SpaceMemberStatusEnum,
  SpaceTypeEnum
} from '@fastgpt/global/support/user/space/constant';
import { SpaceMemberManagePermissionVal } from '@fastgpt/global/support/permission/space/constant';
import { SpacePermission } from '@fastgpt/global/support/permission/space/controller';
type SpaceManageContextType = {
  // 这里可以根据需要添加具体的状态和方法
  // 例如：
  // isModalOpen: boolean;
  // openModal: () => void;
  // closeModal: () => void;
  refetchTeamSize: () => void;
  teamSize: number;
  spaceList: SpaceDetailType[];
  currentSpaceId: string;
  setCurrentSpaceId: (spaceId: string) => void;
  currentSpace: SpaceDetailType | null;
  spaceListLoading: boolean;
  refreshSpaceList: () => void;

  spaceMemberSearchKey: string;
  spaceMemberSearchStatus: SpaceMemberStatusEnum | undefined;
  setSpaceMemberSearchKey: (key: string) => void;
  setSpaceMemberSearchStatus: (status: SpaceMemberStatusEnum | undefined) => void;
};

export const SpaceManageContext = createContext<SpaceManageContextType>({
  // 默认值
  teamSize: 0,
  refetchTeamSize: function (): void {
    throw new Error('Function not implemented.');
  },
  spaceList: [],
  currentSpaceId: '',
  setCurrentSpaceId: function () {
    throw new Error('Function not implemented.');
  },
  currentSpace: null,
  spaceListLoading: false,
  refreshSpaceList: () => {
    throw new Error('Function not implemented.');
  },
  spaceMemberSearchKey: '',
  spaceMemberSearchStatus: undefined,
  setSpaceMemberSearchKey: () => {
    throw new Error('Function not implemented.');
  },
  setSpaceMemberSearchStatus: () => {
    throw new Error('Function not implemented.');
  }
});

export const SpaceManageContextProvider = ({ children }: { children: ReactNode }) => {
  // 这里可以添加状态管理逻辑
  const { userInfo, spaceInfo } = useUserStore();
  const [currentSpaceId, setCurrentSpaceId] = useState<string>('');
  const {
    data: teamMemberCountData,
    refresh: refetchTeamSize,
    loading: teamMemberCountLoading
  } = useRequest2(getTeamMemberCount, {
    manual: false,
    refreshDeps: [userInfo?.team?.teamId]
  });
  const {
    data: spaceList = [],
    loading: spaceListLoading,
    refreshAsync: refreshSpaceList
  } = useRequest2(() => getAllAccessibleSpaces(), {
    manual: false,
    refreshDeps: [userInfo?.team?.teamId],
    onSuccess: (data) => {
      if (currentSpaceId) {
        const targetSpace = data.find((item) => String(item._id) === String(currentSpaceId));
        if (targetSpace) {
          setCurrentSpaceId(targetSpace._id);
          return;
        }
      }
      if (spaceInfo?.type === SpaceTypeEnum.team && spaceInfo?.permission.hasMemberReadPer) {
        // 如果当前所处的空间是团队空间，且有查看成员权限，则设置当前空间ID为该空间
        const targetSpace = data.find((item) => String(item._id) === String(spaceInfo._id));
        if (targetSpace) {
          setCurrentSpaceId(spaceInfo._id);
          return;
        }
      }
      const targetSpace = data.find((item) => {
        const spacePer = new SpacePermission({ per: item.permission.value });
        return item.type === SpaceTypeEnum.team && spacePer.hasMemberReadPer;
      });
      targetSpace && setCurrentSpaceId(targetSpace._id);
    }
  });

  const loading = useMemo(() => {
    return spaceListLoading || teamMemberCountLoading;
  }, [spaceListLoading, teamMemberCountLoading]);
  const currentSpace = useMemo(() => {
    return spaceList.find((space) => space._id === currentSpaceId) || null;
  }, [currentSpaceId, spaceList]);
  const [spaceMemberSearchKey, setSpaceMemberSearchKey] = useState<string>('');
  const [spaceMemberSearchStatus, setSpaceMemberSearchStatus] = useState<
    SpaceMemberStatusEnum | undefined
  >();
  const contextValue: SpaceManageContextType = {
    // 实现具体的状态和方法
    teamSize: teamMemberCountData?.count || 0,
    refetchTeamSize,
    spaceList,
    currentSpaceId,
    setCurrentSpaceId,
    currentSpace,
    spaceListLoading: loading,
    refreshSpaceList,
    spaceMemberSearchKey,
    spaceMemberSearchStatus,
    setSpaceMemberSearchKey,
    setSpaceMemberSearchStatus
  };

  return <SpaceManageContext.Provider value={contextValue}>{children}</SpaceManageContext.Provider>;
};

export default SpaceManageContextProvider;
