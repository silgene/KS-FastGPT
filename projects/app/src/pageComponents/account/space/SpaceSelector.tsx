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
import { SpaceTypeEnum } from '@fastgpt/global/support/user/space/constant';

const SpaceSelector = ({
  showManage,
  showPersonal = true,
  isGlobal,
  value,
  onChange,
  list = [],
  ...props
}: Omit<ButtonProps, 'onChange'> & {
  showManage?: boolean;
  showPersonal?: boolean;
  // isGlobal为true时,切换的是用户当前的空间
  // isGlobal为false时,仅触发onChange回调,显示的是value对应的空间,列表为list
  isGlobal?: boolean;
  value?: string;
  list?: SpaceDetailType[];
  onChange?: (spaceId: string) => void;
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { spaceInfo, setSpaceInfo } = useUserStore();
  const { setLoading } = useSystemStore();
  // 如果isGlobal为true,则自动获取所有可访问的空间
  const { data: mySpaces = [] } = useRequest2(
    async () => {
      if (isGlobal) return getAllAccessibleSpaces();
    },
    {
      manual: false,
      refreshDeps: [isGlobal]
    }
  );
  // 切换全局space
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
    return isGlobal ? mySpaces : list;
  }, [isGlobal, mySpaces, list]);
  const canShowManage = useMemo(() => {
    // TODO: 在空间权限重构之后需要变hasManagePer
    return showManage && spaceList.find((item) => item.permission.hasManagePer);
  }, [showManage, spaceList]);
  const teamSpaceList = useMemo(() => {
    return spaceList
      .filter((item) => item.type === SpaceTypeEnum.team)
      .map((space) => {
        return {
          icon: space.avatar,
          iconSize: '1.25rem',
          label: space.name,
          value: space._id,
          description: space.team.name
        };
      });
  }, [spaceList]);
  const personalSpaceList = useMemo(() => {
    if (!showPersonal) return [];
    return spaceList
      .filter((item) => item.type === SpaceTypeEnum.personal)
      .map((space) => {
        return {
          icon: space.avatar,
          iconSize: '1.25rem',
          label: space.name,
          value: space._id,
          description: space.team.name
        };
      });
  }, [spaceList, showPersonal]);

  const formatSpaceList = useMemo(() => {
    return [
      ...(canShowManage
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
      ...(personalSpaceList.length > 0
        ? [
            {
              customRender: (
                <Box fontSize={12} ml={3} fontWeight={600}>
                  {t('common:user.space.type.personal')}
                </Box>
              )
            }
          ]
        : []),
      ...personalSpaceList,
      ...(teamSpaceList.length > 0
        ? [
            {
              customRender: (
                <Box fontSize={12} mt={2} ml={3} fontWeight={600}>
                  {t('common:user.space.type.team')}
                </Box>
              )
            }
          ]
        : []),
      ...teamSpaceList
    ];
  }, [canShowManage, t, personalSpaceList, teamSpaceList]);

  const handleChange = (value: string) => {
    if (value === 'manage') {
      router.push('/account/space');
      return;
    }
    if (isGlobal) {
      onSwitchSpace(value);
      return;
    }
    onChange?.(value); // 仅触发onChange回调，不切换空间
  };

  return (
    <Box w={'100%'}>
      <MySelect
        {...props}
        value={isGlobal ? spaceInfo?._id : value}
        list={formatSpaceList}
        onChange={handleChange}
      />
    </Box>
  );
};

export default React.memo(SpaceSelector);
