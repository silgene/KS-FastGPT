import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  ModalBody,
  ModalFooter,
  Text,
  useToast,
  VStack,
  Radio,
  RadioGroup
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getTeamMembers } from '@/web/support/user/team/api';
import { addSpaceMembers } from '@/web/support/user/space/api';
import type { TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import MyAvatar from '@fastgpt/web/components/common/Avatar';
import SearchInput from '@fastgpt/web/components/common/Input/SearchInput';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { getAvailableTeamMembers } from '@/web/support/user/space/api';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import type { ParseKeys } from '@fastgpt/web/types/i18next';
import { getRoleList } from '@/web/support/user/role/api';
import AddMembersWithRole, { type AddMembersViewItemType } from '../AddMembersWithRole';

const SpaceAddMemberModal = ({
  spaceId,
  onClose,
  onSuccess
}: {
  spaceId: string;
  onClose: () => void;
  onSuccess?: () => void;
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [selectedMembers, setSelectedMembers] = useState<AddMembersViewItemType[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [searchKey, setSearchKey] = useState('');

  // 获取空间角色列表
  const { data: spaceRoles, loading: loadingRoles } = useRequest2(
    () => getRoleList({ type: RoleTypeEnum.space }),
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

  // 获取团队成员列表
  const {
    data: teamMembers,
    isLoading: loadingMembers,
    ScrollData: TeamMemberScrollData
  } = useScrollPagination(getAvailableTeamMembers, {
    pageSize: 15,
    params: {
      withPermission: true,
      withOrgs: true,
      status: TeamMemberStatusEnum.active,
      searchKey,
      spaceId
    },
    debounceWait: 300,
    refreshDeps: [searchKey]
  });

  // 提交添加成员
  const { runAsync: handleSubmit, loading: isSubmitting } = useRequest2(
    async () => {
      if (selectedMembers.length === 0) {
        throw new Error('请选择要添加的成员');
      }
      if (!selectedRoleId) {
        throw new Error('请选择角色');
      }

      await addSpaceMembers({
        spaceId,
        tmbs: selectedMembers.map((m) => m.id),
        roleId: selectedRoleId
      });
    },
    {
      successToast: '成员添加成功',
      onSuccess() {
        onSuccess?.(); // 调用父组件的刷新函数
        onClose();
      }
    }
  );

  return (
    <MyModal
      isOpen
      onClose={onClose}
      iconSrc="modal/AddClb"
      title="添加团队成员到空间"
      minW="900px"
      maxW={'70vw'}
      h={'100%'}
      maxH={'90vh'}
      isCentered
      // isLoading={loadingMembers || loadingRoles}
    >
      <ModalBody flex={'1'} display={'flex'} flexDirection="column">
        <AddMembersWithRole
          MemberScrollDataWrapper={TeamMemberScrollData}
          members={teamMembers.map((item) => ({
            id: item.tmbId,
            name: item.memberName,
            avatar: item.avatar,
            info: item.role.defaultRole ? t(item.role.name as ParseKeys) : item.role.name
          }))}
          roleList={spaceRoles || []}
          selectedMembers={selectedMembers || []}
          setSelectedMembers={setSelectedMembers}
          searchKey={searchKey}
          setSearchKey={setSearchKey}
          selectedRoleId={selectedRoleId}
          setSelectedRoleId={setSelectedRoleId}
        ></AddMembersWithRole>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" mr={3} onClick={onClose}>
          取消
        </Button>
        <Button
          isLoading={isSubmitting}
          h={'32px'}
          onClick={handleSubmit}
          isDisabled={selectedMembers.length === 0 || !selectedRoleId}
        >
          添加成员 ({selectedMembers.length})
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default SpaceAddMemberModal;
