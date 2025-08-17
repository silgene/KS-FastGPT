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
import { type useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';
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
export type AddMembersViewItemType = { avatar?: string; name: string; id: string; info?: string };
// 成员卡片组件
const MemberCard = ({
  member,
  isSelected,
  onToggle
}: {
  member: AddMembersViewItemType;
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
      {member.avatar && <MyAvatar src={member.avatar} w="2rem" borderRadius={'50%'} />}
      <Box ml="2" w="full">
        <Text fontWeight="medium">{member.name}</Text>
        <Text fontSize="sm" color="gray.600">
          {member.info}
        </Text>
      </Box>
      {isSelected && <Box w="4" h="3" bg="blue.500" borderRadius="full" />}
    </HStack>
  );
};

const AddMembersWithRole = ({
  MemberScrollDataWrapper,
  members,
  roleList,
  selectedMembers,
  setSelectedMembers,
  setSearchKey,
  selectedRoleId,
  setSelectedRoleId
}: {
  MemberScrollDataWrapper: ReturnType<typeof useScrollPagination>['ScrollData'];
  members: AddMembersViewItemType[];
  roleList: RoleSchemaType[];
  selectedMembers: AddMembersViewItemType[];
  setSelectedMembers: (val: AddMembersViewItemType[]) => void;
  searchKey: string;
  setSearchKey: (val: string) => void;
  selectedRoleId: string;
  setSelectedRoleId: (val: string) => void;
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  // 处理成员选择
  const handleMemberToggle = (newMember: AddMembersViewItemType) => {
    if (selectedMembers.find((m) => m.id === newMember.id)) {
      setSelectedMembers(selectedMembers.filter((member) => member.id !== newMember.id));
    } else {
      setSelectedMembers([...selectedMembers, newMember]);
    }
  };

  return (
    <Grid
      border="1px solid"
      borderColor="myGray.200"
      borderRadius="0.5rem"
      gridTemplateColumns="300px 1fr 1fr"
      flexGrow={1}
      // h={'100%'}
    >
      {/* 最左栏：权限选择 */}
      <Flex
        h={'100%'}
        flexDirection="column"
        borderRight="1px solid"
        borderColor="myGray.200"
        p={'4'}
        overflowY={'auto'}
      >
        <Text fontSize="md" fontWeight="medium" mb={4}>
          设置角色
        </Text>
        <RadioGroup value={selectedRoleId} onChange={setSelectedRoleId}>
          <VStack spacing={4} align="stretch">
            {roleList
              ?.filter((role) => !role.ownerRole)
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
        p={4}
        pr={0}
      >
        <SearchInput
          placeholder="搜索成员"
          bgColor="myGray.50"
          onChange={(e) => setSearchKey(e.target.value)}
          mr={4}
        />

        <Flex flexDirection="column" mt="3" overflow={'auto'} flex={'1 0 0'} h={0}>
          <MemberScrollDataWrapper
            flexDirection={'column'}
            gap={1}
            userSelect={'none'}
            minHeight={'20%'}
            height={'fit-content'}
          >
            {members.map((member) => {
              const isSelected = !!selectedMembers.find((m) => m.id === member.id);
              return (
                <MemberCard
                  key={member.id}
                  member={member}
                  isSelected={isSelected}
                  onToggle={() => handleMemberToggle(member)}
                />
              );
            })}
          </MemberScrollDataWrapper>
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
              key={member.id}
              justifyContent="space-between"
              py="2"
              px="3"
              borderRadius="sm"
              alignItems="center"
              bg="blue.50"
              border="1px solid"
              borderColor="blue.200"
            >
              {member.avatar && <MyAvatar src={member.avatar} w="1.5rem" borderRadius={'50%'} />}
              <Box ml="2" w="full">
                <Text fontSize="sm" fontWeight="medium">
                  {member.name}
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
  );
};

export default AddMembersWithRole;
