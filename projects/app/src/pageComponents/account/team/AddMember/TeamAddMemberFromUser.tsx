import { getUserList } from '@/web/support/user/api';
import { getRoleList } from '@/web/support/user/role/api';
import { Button, Flex, ModalBody, ModalFooter } from '@chakra-ui/react';
import { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddMembersWithRole, { type AddMembersViewItemType } from '../../AddMembersWithRole';
import type { ParseKeys } from '@fastgpt/web/types/i18next';
import FillRowTabs from '@fastgpt/web/components/common/Tabs/FillRowTabs';
import { useUserStore } from '@/web/support/user/useUserStore';
import { getAvailableUsers, inviteUserToTeam } from '@/web/support/user/team/api';

const TeamAddMemberFromUser = ({
  teamId,
  onSuccess,
  onClose
}: {
  teamId: string;
  onSuccess?: () => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { userInfo } = useUserStore();
  const [selectedMembers, setSelectedMembers] = useState<AddMembersViewItemType[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [searchKey, setSearchKey] = useState('');
  // 获取空间角色列表
  const { data: teamRoles, loading: loadingRoles } = useRequest2(
    () => getRoleList({ type: RoleTypeEnum.team }),
    {
      manual: false,
      refreshDeps: [],
      onSuccess: (data) => {
        if (data.length > 0) {
          // 默认选中第一个角色
          setSelectedRoleId(data[0]._id);
        }
      }
    }
  );

  // 获取用户列表
  const {
    data: userList,
    isLoading: loadingMembers,
    ScrollData: UserListScrollData
  } = useScrollPagination(getAvailableUsers, {
    pageSize: 15,
    params: {
      searchKey,
      teamId
    },
    debounceWait: 300,
    refreshDeps: [searchKey]
  });

  // 提交添加成员
  const { runAsync: handleSubmit, loading: isSubmitting } = useRequest2(
    async () => {
      if (selectedMembers.length === 0) {
        throw new Error('请选择要添加的用户');
      }
      if (!selectedRoleId) {
        throw new Error('请选择角色');
      }
      await inviteUserToTeam({
        teamId,
        userIds: selectedMembers.map((item) => item.id),
        roleId: selectedRoleId
      });
    },
    {
      successToast: '添加成功',
      onSuccess() {
        onSuccess?.();
      }
    }
  );
  return (
    <>
      <AddMembersWithRole
        MemberScrollDataWrapper={UserListScrollData}
        members={userList.map((item) => ({
          id: item._id,
          name: item.username,
          info: item.role?.defaultRole ? t(item.role?.name as ParseKeys) : item.role?.name
        }))}
        roleList={teamRoles || []}
        selectedMembers={selectedMembers || []}
        setSelectedMembers={setSelectedMembers}
        searchKey={searchKey}
        setSearchKey={setSearchKey}
        selectedRoleId={selectedRoleId}
        setSelectedRoleId={setSelectedRoleId}
      ></AddMembersWithRole>
      <Flex justifyContent={'flex-end'} mt={4}>
        <Button variant="ghost" mr={3} onClick={onClose}>
          取消
        </Button>
        <Button
          isLoading={isSubmitting}
          h={'32px'}
          onClick={handleSubmit}
          isDisabled={selectedMembers.length === 0 || !selectedRoleId}
        >
          添加用户 ({selectedMembers.length})
        </Button>
      </Flex>
    </>
  );
};
export default TeamAddMemberFromUser;
