import React, { type ReactNode, useCallback, useState } from 'react';
import { createContext } from 'use-context-selector';
import type { EditTeamFormDataType } from './EditInfoModal';
import dynamic from 'next/dynamic';
import {
  getTeamList,
  getTeamMemberCount,
  getTeamMembers,
  putSwitchTeam
} from '@/web/support/user/team/api';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { useUserStore } from '@/web/support/user/useUserStore';
import type { TeamTmbItemType, TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useTranslation } from 'next-i18next';
import { useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';
import { useRouter } from 'next/router';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';

const EditInfoModal = dynamic(() => import('./EditInfoModal'));

type TeamModalContextType = {
  myTeams: TeamTmbItemType[];
  isLoading: boolean;
  currentTeam: TeamTmbItemType | undefined;
  onSwitchTeam: (teamId: string) => void;
  setEditTeamData: React.Dispatch<React.SetStateAction<EditTeamFormDataType | undefined>>;

  refetchTeamSize: () => void;
  refetchTeams: () => void;
  teamSize: number;
};

export const TeamContext = createContext<TeamModalContextType>({
  myTeams: [],
  currentTeam: undefined,
  isLoading: false,
  onSwitchTeam: function (_teamId: string): void {
    throw new Error('Function not implemented.');
  },
  setEditTeamData: function (_value: React.SetStateAction<EditTeamFormDataType | undefined>): void {
    throw new Error('Function not implemented.');
  },
  refetchTeams: function (): void {
    throw new Error('Function not implemented.');
  },
  refetchTeamSize: function (): void {
    throw new Error('Function not implemented.');
  },
  teamSize: 0
});

export const TeamModalContextProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const [editTeamData, setEditTeamData] = useState<EditTeamFormDataType>();
  const { userInfo, initUserInfo } = useUserStore();

  const [currentTeam, setCurrentTeam] = useState<TeamTmbItemType>();
  const {
    data: myTeams = [],
    loading: isLoadingTeams,
    refresh: refetchTeams
  } = useRequest2(
    async () => {
      const res = await getTeamList(TeamMemberStatusEnum.active);
      return res.filter((tmb) => {
        // 判断当前用户否有权限管理团队成员
        const permission = new TeamPermission({ per: tmb.permission.value });
        return permission.hasManageMemberPer;
      });
    },
    {
      manual: false,
      refreshDeps: [userInfo?._id],
      onSuccess: (data) => {
        if (data.length === 0) return;
        if (!currentTeam) {
          const curTeam = data.find((tmb) => tmb.teamId === userInfo?.team?.teamId);
          setCurrentTeam(curTeam || data[0]);
        }
      }
    }
  );

  const { data: teamMemberCountData, refresh: refetchTeamSize } = useRequest2(
    async () => {
      if (currentTeam) return getTeamMemberCount(currentTeam.teamId);
    },
    {
      manual: false,
      refreshDeps: [currentTeam]
    }
  );

  // const { runAsync: onSwitchTeam, loading: isSwitchingTeam } = useRequest2(
  //   async (teamId: string) => {
  //     await putSwitchTeam(teamId);
  //     return initUserInfo();
  //   },
  //   {
  //     onSuccess: () => {
  //       router.reload();
  //     },
  //     errorToast: t('common:user.team.Switch Team Failed')
  //   }
  // );

  const onSwitchTeam = useCallback(
    (teamId: string) => {
      const team = myTeams.find((tmb) => tmb.teamId === teamId);
      setCurrentTeam(team);
    },
    [myTeams, setCurrentTeam]
  );
  const isLoading = isLoadingTeams;

  const contextValue = {
    myTeams,
    refetchTeams,
    isLoading,
    onSwitchTeam,

    // create | update team
    setEditTeamData,
    teamSize: teamMemberCountData?.count || 0,
    refetchTeamSize,
    currentTeam
  };

  return (
    <TeamContext.Provider value={contextValue}>
      {userInfo?.team?.permission && (
        <>
          {children}
          {!!editTeamData && (
            <EditInfoModal
              defaultData={editTeamData}
              onClose={() => setEditTeamData(undefined)}
              onSuccess={() => {
                refetchTeams();
                initUserInfo();
              }}
            />
          )}
        </>
      )}
    </TeamContext.Provider>
  );
};

export default TeamModalContextProvider;
