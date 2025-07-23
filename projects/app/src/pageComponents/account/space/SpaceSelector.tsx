import React, { useMemo } from 'react';
import { Box, type ButtonProps } from '@chakra-ui/react';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useTranslation } from 'next-i18next';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import MySelect from '@fastgpt/web/components/common/MySelect';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useRouter } from 'next/router';
import { getAllAccessibleSpaces } from '@/web/support/user/space/api';
import type { SpaceDetailType } from '@fastgpt/global/support/user/space/type';

const SpaceSelector = ({
  showManage,
  onChange,
  ...props
}: Omit<ButtonProps, 'onChange'> & {
  showManage?: boolean;
  onChange?: () => void;
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { spaceInfo, setSpaceInfo } = useUserStore();
  const { setLoading } = useSystemStore();

  const { data: mySpaces = [] } = useRequest2(() => getAllAccessibleSpaces(), {
    manual: false,
    refreshDeps: []
  });

  const { runAsync: onSwitchSpace } = useRequest2(
    async (spaceId: string) => {
      setLoading(true);
      const space = mySpaces.find((s: SpaceDetailType) => s._id === spaceId);
      setSpaceInfo(space);
    },
    {
      onFinally: () => {
        // router.reload();
        setLoading(false);
      },
      errorToast: t('common:user.space.Switch Space Failed')
    }
  );

  const spaceList = useMemo(() => {
    return mySpaces.map((space) => {
      return {
        icon: space.avatar,
        iconSize: '1.25rem',
        label: space.name,
        value: space._id,
        description: space.team.name
      };
    });
  }, [mySpaces]);

  const formatSpaceList = useMemo(() => {
    return [
      ...(showManage
        ? [
            {
              icon: 'common/setting',
              iconSize: '1.25rem',
              label: t('user:manage_space'),
              value: 'manage',
              showBorder: true
            }
          ]
        : []),
      ...spaceList
    ];
  }, [showManage, t, spaceList]);

  const handleChange = (value: string) => {
    if (value === 'manage') {
      // router.push('/account/team');
    } else {
      onSwitchSpace(value);
    }
  };

  return (
    <Box w={'100%'}>
      <MySelect {...props} value={spaceInfo?._id} list={formatSpaceList} onChange={handleChange} />
    </Box>
  );
};

export default SpaceSelector;
