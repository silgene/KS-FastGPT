import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  useDisclosure,
  Tr,
  HStack,
  Button,
  VStack
} from '@chakra-ui/react';
import RoleSelect from '@/components/support/user/role/RoleSelect';
import Icon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'next-i18next';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useUserStore } from '@/web/support/user/useUserStore';
import PopoverConfirm from '@fastgpt/web/components/common/MyPopover/PopoverConfirm';
import format from 'date-fns/format';
import { useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';
import MyIconButton from '@fastgpt/web/components/common/Icon/button';
import MyBox from '@fastgpt/web/components/common/MyBox';
import Avatar from '@fastgpt/web/components/common/Avatar';
import dynamic from 'next/dynamic';
import { type PaginationProps, type PaginationResponse } from '@fastgpt/web/common/fetch/type';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { serviceSideProps } from '@/web/common/i18n/utils';
import AccountContainer from '@/pageComponents/account/AccountContainer';
import { getRoleList } from '@/web/support/user/role/api';
import { type ParseKeys } from '@fastgpt/web/types/i18next';
import { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { getSystemUserList, updateMemberRole } from '@/web/support/user/member/api';
import type { GetUserListQuery, GetUserListResponse } from '@fastgpt/global/support/user/api';
import type { UserModelSchema } from '@fastgpt/global/support/user/type';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';

const CreateUserModal = dynamic(() => import('@/pageComponents/account/member/CreateUserModal'));

// 临时API函数，实际应该从API文件导入
const removeSystemMember = async (memberId: string): Promise<void> => {
  // TODO: 实现实际的API调用
  console.log('删除用户:', memberId);
};

function SystemMemberManage() {
  const { t } = useTranslation();
  const { userInfo } = useUserStore();
  const { toast } = useToast();

  const {
    data: members = [],
    isLoading: loadingMembers,
    refreshList: refetchMemberList,
    ScrollData: MemberScrollData
  } = useScrollPagination<GetUserListQuery, GetUserListResponse>(
    (params) => getSystemUserList(params),
    {
      pageSize: 20,
      throttleWait: 500,
      debounceWait: 200
    }
  );

  const {
    isOpen: isOpenCreateUserModal,
    onOpen: onOpenCreateUserModal,
    onClose: onCloseCreateUserModal
  } = useDisclosure();

  const onRefreshMembers = useCallback(() => {
    refetchMemberList();
  }, [refetchMemberList]);

  const { runAsync: onRemoveMember, loading: removeMemberLoading } = useRequest2(
    (memberId: string) => removeSystemMember(memberId),
    {
      onSuccess: onRefreshMembers
    }
  );

  const { data: myRoleList = [] } = useRequest2(() => getRoleList({ type: RoleTypeEnum.system }), {
    manual: false
  });

  const { runAsync: onUpdateMemberRole, loading: updateMemberLoading } = useRequest2(
    ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      updateMemberRole({
        type: RoleTypeEnum.system,
        userId: memberId,
        roleId
      }),
    {
      onSuccess: () => {
        toast({
          title: t('common:Success'),
          status: 'success'
        });
      }
    }
  );

  const handleUpdateMemberRole = useCallback(
    async (memberId: string, newRoleId: string) => {
      await onUpdateMemberRole({ memberId, roleId: newRoleId });
      onRefreshMembers();
    },
    [onUpdateMemberRole, onRefreshMembers]
  );

  const isLoading = useMemo(
    () => loadingMembers || updateMemberLoading || removeMemberLoading,
    [loadingMembers, updateMemberLoading, removeMemberLoading]
  );

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
        gap={1}
      >
        <Flex align={'center'} flexShrink={0}>
          <Flex gap={2} color={'myGray.900'}>
            <Icon name="support/user/usersLight" w={'1.25rem'} h={'1.25rem'} />
            <Box fontWeight={'500'} fontSize={'1rem'}>
              系统成员管理
            </Box>
          </Flex>
        </Flex>
        <Box ml={'auto'}></Box>
        <Button
          variant={'primary'}
          size="md"
          borderRadius={'md'}
          leftIcon={<MyIcon name="common/addCircleLight" w={'16px'} />}
          onClick={onOpenCreateUserModal}
        >
          创建用户
        </Button>
        <Box
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

      {/* 成员管理表格 */}
      <MyBox isLoading={isLoading} flex={'1 0 0'} py={'1.5rem'} px={'2rem'}>
        <MemberScrollData>
          <TableContainer overflow={'unset'} fontSize={'sm'}>
            <Table overflow={'unset'}>
              <Thead>
                <Tr bgColor={'white !important'}>
                  <Th borderLeftRadius="6px" bgColor="myGray.100">
                    用户名
                  </Th>
                  <Th bgColor="myGray.100" pl={9}>
                    角色
                  </Th>
                  <Th bgColor="myGray.100">创建时间</Th>
                  <Th borderRightRadius="6px" bgColor="myGray.100">
                    {t('common:Action')}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {members.map((member) => {
                  const canEditPermissions =
                    !member.role?.ownerRole && userInfo?.systemPermission.hasUserManagePer; // TODO: 根据实际权限控制
                  const canDelete = member._id !== userInfo?._id; // 不能删除自己

                  return (
                    <Tr key={member._id} overflow={'unset'}>
                      <Td>
                        <HStack>
                          <Avatar src={''} w={['18px', '22px']} borderRadius={'50%'} />
                          <Box className={'textEllipsis'}>{member.username}</Box>
                        </HStack>
                      </Td>
                      <Td maxW={'300px'}>
                        <RoleSelect
                          value={member?.role?._id}
                          onChange={(newRoleId) => handleUpdateMemberRole(member._id, newRoleId)}
                          disabled={!canEditPermissions}
                          isOwner={member.role?.ownerRole}
                          myRoleList={myRoleList}
                        />
                      </Td>
                      <Td maxW={'300px'}>
                        <Box>{format(new Date(member.createTime), 'yyyy-MM-dd HH:mm:ss')}</Box>
                      </Td>
                      <Td>
                        {canDelete && (
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
                              content={`确定要删除用户 ${member.username} 吗？`}
                              onConfirm={() => onRemoveMember(member._id)}
                            />
                          </HStack>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        </MemberScrollData>
      </MyBox>

      {isOpenCreateUserModal && (
        <CreateUserModal onClose={onCloseCreateUserModal} onSuccess={onRefreshMembers} />
      )}
    </>
  );
}

const SystemMemberManagePage = () => {
  const { userInfo } = useUserStore();

  return userInfo ? (
    <AccountContainer>
      <SystemMemberManage />
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

export default SystemMemberManagePage;
