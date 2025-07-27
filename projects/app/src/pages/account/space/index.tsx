import React, { useCallback, useEffect } from 'react';
import {
  Box,
  Flex,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  HStack,
  VStack
} from '@chakra-ui/react';
import Icon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'next-i18next';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useUserStore } from '@/web/support/user/useUserStore';
import OrgTags from '@/components/support/user/team/OrgTags';
import SpaceSelector from '@/pageComponents/account/space/SpaceSelector';
import PopoverConfirm from '@fastgpt/web/components/common/MyPopover/PopoverConfirm';
import format from 'date-fns/format';
import { useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';
import MyIconButton from '@fastgpt/web/components/common/Icon/button';
import MyBox from '@fastgpt/web/components/common/MyBox';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { delRemoveMember } from '@/web/support/user/team/api';
import { getSpaceMemberList } from '@/web/support/user/space/api';
import { type PaginationResponse } from '@fastgpt/web/common/fetch/type';
import type { SpaceMemberItemType } from '@fastgpt/global/support/user/space/type';
import { useContextSelector } from 'use-context-selector';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { serviceSideProps } from '@/web/common/i18n/utils';
import AccountContainer from '@/pageComponents/account/AccountContainer';
import { SpaceManageModalContext } from '@/pageComponents/account/space/context';
import SpaceManageModalContextProvider from '@/pageComponents/account/space/context';

function SpaceManage() {
  const { t } = useTranslation();
  const { userInfo, spaceInfo } = useUserStore();

  const {
    data: members = [],
    isLoading: loadingMembers,
    refreshList: refetchMemberList,
    ScrollData: MemberScrollData
  } = useScrollPagination<
    any,
    PaginationResponse<SpaceMemberItemType<{ withOrgs: true; withPermission: true }>>
  >(
    async () => {
      // 只有团队空间才获取成员列表
      if (spaceInfo?.type === 'team' && spaceInfo?._id) {
        const memberList = await getSpaceMemberList(spaceInfo._id);
        return {
          list: memberList,
          total: memberList.length
        };
      }
      return { list: [], total: 0 };
    },
    {
      pageSize: 20,
      params: {
        withPermission: true,
        withOrgs: true
      },
      refreshDeps: [spaceInfo?._id, spaceInfo?.type],
      throttleWait: 500,
      debounceWait: 200
    }
  );

  const onRefreshMembers = useCallback(() => {
    refetchMemberList();
  }, [refetchMemberList]);

  const isLoading = loadingMembers;
  const { runAsync: onRemoveMember } = useRequest2(delRemoveMember, {
    onSuccess: onRefreshMembers
  });
  const { teamSize } = useContextSelector(SpaceManageModalContext, (v) => v);

  return (
    <>
      {/* 页面标题和操作区域 */}
      <Flex
        w={'100%'}
        h={'3.5rem'}
        px={'1.56rem'}
        py={'0.56rem'}
        borderBottom={'1px solid'}
        borderColor={'myGray.200'}
        bg={'myGray.25'}
        align={'center'}
        gap={6}
        justify={'space-between'}
      >
        <Flex align={'center'}>
          <Flex gap={2} color={'myGray.900'}>
            <Icon name="support/user/usersLight" w={'1.25rem'} h={'1.25rem'} />
            <Box fontWeight={'500'} fontSize={'1rem'}>
              {t('account:space_management')}
            </Box>
          </Flex>
          <Flex align={'center'} ml={6}>
            <SpaceSelector></SpaceSelector>
          </Flex>
        </Flex>

        <Box
          float={'right'}
          color={'myGray.900'}
          h={'1.25rem'}
          px={'0.5rem'}
          py={'0.125rem'}
          fontSize={'0.75rem'}
          borderRadius={'1.25rem'}
          bg={'myGray.150'}
        >
          {t('account_team:total_team_members', { amount: members.length })}
        </Box>
      </Flex>

      {/* 权限管理表格 */}
      <MyBox isLoading={isLoading} flex={'1 0 0'} py={'1.5rem'} px={'2rem'}>
        <MemberScrollData>
          <TableContainer overflow={'unset'} fontSize={'sm'}>
            <Table overflow={'unset'}>
              <Thead>
                <Tr bgColor={'white !important'}>
                  <Th borderLeftRadius="6px" bgColor="myGray.100">
                    {t('account_team:name')}
                  </Th>
                  <Th bgColor="myGray.100">{t('account_team:user_name')}</Th>
                  <Th bgColor="myGray.100" pl={9}>
                    {t('account_team:user_role')}
                  </Th>
                  <Th bgColor="myGray.100">{t('account_team:join_update_time')}</Th>
                  <Th borderRightRadius="6px" bgColor="myGray.100">
                    {t('common:Action')}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {members.map((member) => (
                  <Tr key={member._id} overflow={'unset'}>
                    <Td>
                      <HStack>
                        <Avatar src={member.avatar} w={['18px', '22px']} borderRadius={'50%'} />
                        <Box className={'textEllipsis'}>{member.name}</Box>
                      </HStack>
                    </Td>
                    <Td maxW={'300px'}>{member.contact || '-'}</Td>
                    <Td maxWidth="300px">
                      {(() => {
                        return <OrgTags orgs={member.orgs || undefined} type="tag" />;
                      })()}
                    </Td>
                    <Td maxW={'300px'}>
                      <VStack gap={0} align="start">
                        <Box>{format(new Date(member.createTime), 'yyyy-MM-dd HH:mm:ss')}</Box>
                        <Box>
                          {member.updateTime
                            ? format(new Date(member.updateTime), 'yyyy-MM-dd HH:mm:ss')
                            : '-'}
                        </Box>
                      </VStack>
                    </Td>
                    <Td>
                      {userInfo?.team.permission.hasManagePer &&
                        member.role !== TeamMemberRoleEnum.owner &&
                        member._id !== userInfo?.team.tmbId && (
                          <HStack>
                            <PopoverConfirm
                              Trigger={
                                <Box>
                                  <MyIconButton
                                    icon={'common/trash'}
                                    hoverColor={'red.500'}
                                    hoverBg="red.50"
                                    size={'1rem'}
                                  />
                                </Box>
                              }
                              type="delete"
                              content={t('account_team:remove_tip', {
                                username: member.name
                              })}
                              onConfirm={() => onRemoveMember(member._id)}
                            />
                          </HStack>
                        )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </MemberScrollData>
      </MyBox>
    </>
  );
}

const SpaceManagePage = () => {
  const { userInfo } = useUserStore();

  return userInfo?.team ? (
    <AccountContainer>
      <SpaceManageModalContextProvider>
        <SpaceManage />
      </SpaceManageModalContextProvider>
    </AccountContainer>
  ) : null;
};

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content, ['account', 'account_team', 'user', 'common']))
    }
  };
}

export default SpaceManagePage;
