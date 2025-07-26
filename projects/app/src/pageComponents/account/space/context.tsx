import type { ReactNode } from 'react';
import { createContext } from 'use-context-selector';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getTeamMemberCount } from '@/web/support/user/team/api';
import { useUserStore } from '@/web/support/user/useUserStore';
type SpaceManageModalContextType = {
  // 这里可以根据需要添加具体的状态和方法
  // 例如：
  // isModalOpen: boolean;
  // openModal: () => void;
  // closeModal: () => void;
  refetchTeamSize: () => void;
  teamSize: number;
};

export const SpaceManageModalContext = createContext<SpaceManageModalContextType>({
  // 默认值
  teamSize: 0,
  refetchTeamSize: function (): void {
    throw new Error('Function not implemented.');
  }
});

export const SpaceManageModalContextProvider = ({ children }: { children: ReactNode }) => {
  // 这里可以添加状态管理逻辑
  const { userInfo } = useUserStore();
  const { data: teamMemberCountData, refresh: refetchTeamSize } = useRequest2(getTeamMemberCount, {
    manual: false,
    refreshDeps: [userInfo?.team?.teamId]
  });
  const contextValue: SpaceManageModalContextType = {
    // 实现具体的状态和方法
    teamSize: teamMemberCountData?.count || 0,
    refetchTeamSize
  };

  return (
    <SpaceManageModalContext.Provider value={contextValue}>
      {children}
    </SpaceManageModalContext.Provider>
  );
};

export default SpaceManageModalContextProvider;
