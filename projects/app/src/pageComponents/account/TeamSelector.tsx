import React, { useEffect, useMemo } from 'react';
import { Box, type ButtonProps } from '@chakra-ui/react';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useTranslation } from 'next-i18next';
import { getTeamList, putSwitchTeam } from '@/web/support/user/team/api';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import MySelect from '@fastgpt/web/components/common/MySelect';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useRouter } from 'next/router';
import type { TeamTmbItemType } from '@fastgpt/global/support/user/team/type';

export type TeamSelectorProps = Omit<ButtonProps, 'onChange'> & {
  showManage?: boolean;
  isGlobal?: boolean; // 是否全局团队选择器
  value?: string;
  list?: TeamTmbItemType[];
  onChange?: (tmbId: string) => void;
  customButton?: React.ReactNode;
  // 当团队列表发生变化时触发, 初始化时也触发
  onTeamTmbsChanged?: (teamTmbs: TeamTmbItemType[]) => void;
};

const TeamSelector = ({
  showManage,
  onChange,
  onTeamTmbsChanged,
  customButton,
  isGlobal,
  list = [],
  value,
  ...buttonProps
}: TeamSelectorProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { userInfo } = useUserStore();
  const { setLoading } = useSystemStore();

  const { data: myTmbs = [] } = useRequest2(() => getTeamList(TeamMemberStatusEnum.active), {
    manual: false,
    refreshDeps: [userInfo]
  });

  const { runAsync: onSwitchTeam } = useRequest2(
    async (teamId: string) => {
      setLoading(true);
      await putSwitchTeam(teamId);
    },
    {
      onFinally: () => {
        router.reload();
        setLoading(false);
      },
      errorToast: t('common:user.team.Switch Team Failed')
    }
  );

  const teamList = useMemo(() => {
    return (isGlobal ? myTmbs : list).map((tmb) => ({
      icon: tmb.teamAvatar,
      iconSize: '1.25rem',
      label: tmb.teamName,
      value: tmb.teamId
    }));
  }, [myTmbs, isGlobal, list]);

  const formatTeamList = useMemo(() => {
    return [
      ...(showManage
        ? [
            {
              icon: 'common/setting',
              iconSize: '1.25rem',
              label: t('user:manage_team'),
              value: 'manage',
              showBorder: true
            }
          ]
        : []),
      ...teamList
    ];
  }, [showManage, t, teamList]);

  const handleChange = (value: string) => {
    if (value === 'manage') {
      router.push('/account/team');
    } else {
      if (isGlobal) onSwitchTeam(value);
      else onChange?.(value);
    }
  };
  useEffect(() => {
    onTeamTmbsChanged?.(myTmbs);
  }, [myTmbs, onTeamTmbsChanged]);
  return (
    <Box w={'100%'}>
      <MySelect
        {...buttonProps}
        customButton={customButton}
        value={isGlobal ? userInfo?.team?.teamId : value}
        list={formatTeamList}
        onChange={handleChange}
      />
    </Box>
  );
};

export default TeamSelector;
