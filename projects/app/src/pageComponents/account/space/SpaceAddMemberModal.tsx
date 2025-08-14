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

const HoverBoxStyle = {
  bgColor: 'myGray.50',
  cursor: 'pointer'
};

// 成员卡片组件
const MemberCard = ({
  member,
  isSelected,
  onToggle
}: {
  member: TeamMemberItemType;
  isSelected: boolean;
  onToggle: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <HStack
      justifyContent="space-between"
      py="2"
      px="3"
      borderRadius="sm"
      alignItems="center"
      _hover={HoverBoxStyle}
      _notLast={{ mb: 1 }}
      onClick={onToggle}
      bg={isSelected ? 'blue.50' : 'transparent'}
      border={isSelected ? '1px solid' : '1px solid transparent'}
      borderColor={isSelected ? 'blue.200' : 'transparent'}
    >
      <MyAvatar src={member.avatar} w="2rem" borderRadius={'50%'} />
      <Box ml="2" w="full">
        <Text fontWeight="medium">{member.memberName}</Text>
        <Text fontSize="sm" color="gray.600">
          {member.role.defaultRole ? t(member.role?.name as ParseKeys) : member.role.name}
        </Text>
      </Box>
      {isSelected && <Box w="4" h="3" bg="blue.500" borderRadius="full" />}
    </HStack>
  );
};

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

  const [selectedMembers, setSelectedMembers] = useState<TeamMemberItemType[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [searchKey, setSearchKey] = useState('');

  // 获取空间角色列表
  const { data: spaceRoles, loading: loadingRoles } = useRequest2(
    () => getRoleList({ type: RoleTypeEnum.space }),
    {
      manual: false,
      refreshDeps: []
    }
  );

  // 设置默认选中的角色（空间只读成员）
  React.useEffect(() => {
    if (spaceRoles && spaceRoles.length > 0 && !selectedRoleId) {
      const readerRole = spaceRoles.find(
        (role) => role.name.includes('Space Reader') || role.permission === ReadPermissionVal
      );
      if (readerRole) {
        setSelectedRoleId(readerRole._id);
      } else {
        setSelectedRoleId(spaceRoles[0]._id);
      }
    }
  }, [spaceRoles, selectedRoleId]);

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

  // 处理成员选择
  const handleMemberToggle = useCallback((member: TeamMemberItemType) => {
    setSelectedMembers((prev) => {
      const exists = prev.find((m) => m.tmbId === member.tmbId);
      if (exists) {
        return prev.filter((m) => m.tmbId !== member.tmbId);
      }
      return [...prev, member];
    });
  }, []);

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
        tmbs: selectedMembers.map((m) => m.tmbId),
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
      <ModalBody flex={'1'}>
        <Grid
          border="1px solid"
          borderColor="myGray.200"
          borderRadius="0.5rem"
          gridTemplateColumns="300px 1fr 1fr"
          h={'100%'}
        >
          {/* 最左栏：权限选择 */}
          <Flex
            h={'100%'}
            flexDirection="column"
            borderRight="1px solid"
            borderColor="myGray.200"
            p="4"
          >
            <Text fontSize="md" fontWeight="medium" mb={4}>
              设置角色
            </Text>
            <RadioGroup value={selectedRoleId} onChange={setSelectedRoleId}>
              <VStack spacing={4} align="stretch">
                {spaceRoles
                  ?.filter((role) => !role.name.includes('Owner'))
                  .map((role) => (
                    <Box key={role._id}>
                      <Radio value={role._id} mb={1}>
                        <Text fontWeight="medium" fontSize="sm">
                          {role.defaultRole ? t(role.name as ParseKeys) : role.name}
                        </Text>
                      </Radio>
                      <Text fontSize="xs" color="gray.600" ml={6}>
                        {role.defaultRole ? t(role.description as ParseKeys) : role.description}
                      </Text>
                    </Box>
                  ))}
              </VStack>
            </RadioGroup>
          </Flex>

          {/* 中间栏：成员选择 */}
          <Flex
            h={'100%'}
            flexDirection="column"
            borderRight="1px solid"
            borderColor="myGray.200"
            p="4"
          >
            <SearchInput
              placeholder="搜索团队成员"
              bgColor="myGray.50"
              onChange={(e) => setSearchKey(e.target.value)}
            />

            <Flex flexDirection="column" mt="3" overflow={'auto'} flex={'1 0 0'} h={0}>
              {searchKey ? (
                teamMembers?.map((member) => {
                  const isSelected = selectedMembers.some((m) => m.tmbId === member.tmbId);
                  return (
                    <MemberCard
                      key={member.tmbId}
                      member={member}
                      isSelected={isSelected}
                      onToggle={() => handleMemberToggle(member)}
                    />
                  );
                })
              ) : (
                <TeamMemberScrollData
                  flexDirection={'column'}
                  gap={1}
                  userSelect={'none'}
                  minHeight={'20%'}
                  height={'fit-content'}
                >
                  {teamMembers?.map((member) => {
                    const isSelected = selectedMembers.some((m) => m.tmbId === member.tmbId);
                    return (
                      <MemberCard
                        key={member.tmbId}
                        member={member}
                        isSelected={isSelected}
                        onToggle={() => handleMemberToggle(member)}
                      />
                    );
                  })}
                </TeamMemberScrollData>
              )}
            </Flex>
          </Flex>

          {/* 最右栏：已选成员 */}
          <Flex h={'100%'} p="4" flexDirection="column">
            <Box mb={3}>
              <Text fontSize="md" fontWeight="medium">
                已选择成员 ({selectedMembers.length})
              </Text>
            </Box>
            <Flex flexDirection="column" gap={1} overflow={'auto'} flex={'1 0 0'} h={0}>
              {selectedMembers.map((member) => (
                <HStack
                  key={member.tmbId}
                  justifyContent="space-between"
                  py="2"
                  px="3"
                  borderRadius="sm"
                  alignItems="center"
                  bg="blue.50"
                  border="1px solid"
                  borderColor="blue.200"
                >
                  <MyAvatar src={member.avatar} w="1.5rem" borderRadius={'50%'} />
                  <Box ml="2" w="full">
                    <Text fontSize="sm" fontWeight="medium">
                      {member.memberName}
                    </Text>
                  </Box>
                  <Button
                    size="xs"
                    p={3}
                    variant="ghost"
                    _hover={{ bg: 'myGray.150' }}
                    onClick={() => handleMemberToggle(member)}
                  >
                    移除
                  </Button>
                </HStack>
              ))}
              {selectedMembers.length === 0 && (
                <Text fontSize="sm" color="gray.500" textAlign="center" mt={4}>
                  暂未选择成员
                </Text>
              )}
            </Flex>
          </Flex>
        </Grid>
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
