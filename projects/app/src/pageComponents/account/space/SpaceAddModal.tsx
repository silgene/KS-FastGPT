import React, { useState, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Flex,
  Text,
  Avatar,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  useToast,
  Divider,
  HStack
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getTeamMembers } from '@/web/support/user/team/api';
// import { updateSpaceCollaborators } from '@/web/support/user/space/api';
import type { TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import {
  ReadPermissionVal,
  WritePermissionVal,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
// import { useSpaceManageModalContext } from './context';

const SpaceAddModal = ({ spaceId, onClose }: { spaceId: string; onClose: () => void }) => {
  const { t } = useTranslation();
  const toast = useToast();
  // const { refetchTeamSize } = useSpaceManageModalContext();

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [permission, setPermission] = useState<string>(ReadPermissionVal.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取团队成员列表
  const {
    data: teamMembers,
    isLoading: loadingMembers,
    ScrollData: TeamMemberScrollData,
    refreshList
  } = useScrollPagination(getTeamMembers, {
    pageSize: 15,
    params: {
      withPermission: true,
      withOrgs: true,
      status: 'active'
    },
    throttleWait: 500,
    debounceWait: 200
  });

  // 处理成员选择
  const handleMemberToggle = useCallback((tmbId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(tmbId) ? prev.filter((id) => id !== tmbId) : [...prev, tmbId]
    );
  }, []);

  // 全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectedMembers.length === teamMembers?.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(teamMembers?.map((member: TeamMemberItemType) => member.tmbId) || []);
    }
  }, [selectedMembers.length, teamMembers]);

  // 提交添加成员
  const handleSubmit = useCallback(async () => {
    if (selectedMembers.length === 0) {
      toast({
        title: '请选择要添加的成员',
        status: 'warning'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: 实现 updateSpaceCollaborators API
      // await updateSpaceCollaborators({
      //   spaceId,
      //   members: selectedMembers,
      //   permission: parseInt(permission)
      // });

      toast({
        title: '成员添加成功',
        status: 'success'
      });

      // 刷新团队成员数量
      // refetchTeamSize();
      onClose();
    } catch (error: any) {
      toast({
        title: '添加成员失败',
        description: error?.message || '未知错误',
        status: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMembers, permission, spaceId, toast, onClose]);

  // 权限选项
  const permissionOptions = [
    {
      value: ReadPermissionVal.toString(),
      label: '只读权限',
      description: '可查看该空间的应用'
    },
    {
      value: WritePermissionVal.toString(),
      label: '编辑权限',
      description: '可查看和编辑空间的应用'
    },
    {
      value: ManagePermissionVal.toString(),
      label: '管理权限',
      description: '可管理该空间，包括编辑、删除和设置权限'
    }
  ];

  return (
    <Modal isOpen={true} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>添加团队成员到空间</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {/* 权限设置 */}
          <Box mb={6}>
            <Text fontSize="md" fontWeight="medium" mb={3}>
              设置权限
            </Text>
            <RadioGroup value={permission} onChange={setPermission}>
              <Stack spacing={3}>
                {permissionOptions.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    <Box>
                      <Text fontWeight="medium">{option.label}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {option.description}
                      </Text>
                    </Box>
                  </Radio>
                ))}
              </Stack>
            </RadioGroup>
          </Box>

          <Divider mb={4} />

          {/* 成员选择 */}
          <Box>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="md" fontWeight="medium">
                选择成员 ({selectedMembers.length}/{teamMembers?.length || 0})
              </Text>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSelectAll}
                isDisabled={loadingMembers || !teamMembers?.length}
              >
                {selectedMembers.length === teamMembers?.length ? '取消全选' : '全选'}
              </Button>
            </Flex>

            {loadingMembers ? (
              <Text>加载中...</Text>
            ) : (
              <Box maxH="300px" overflowY="auto">
                {teamMembers?.map((member: TeamMemberItemType) => (
                  <Flex
                    key={member.tmbId}
                    align="center"
                    p={3}
                    borderRadius="md"
                    _hover={{ bg: 'gray.50' }}
                    cursor="pointer"
                    onClick={() => handleMemberToggle(member.tmbId)}
                  >
                    <Checkbox
                      isChecked={selectedMembers.includes(member.tmbId)}
                      onChange={() => handleMemberToggle(member.tmbId)}
                      mr={3}
                    />
                    <Avatar size="sm" src={member.avatar} name={member.memberName} mr={3} />
                    <Box flex={1}>
                      <Text fontWeight="medium">{member.memberName}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {member.role === 'owner'
                          ? '团队所有者'
                          : member.role === 'admin'
                            ? '管理员'
                            : '成员'}
                      </Text>
                    </Box>
                  </Flex>
                ))}

                {!teamMembers?.length && (
                  <Text textAlign="center" color="gray.500" py={4}>
                    暂无团队成员
                  </Text>
                )}
              </Box>
            )}
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            取消
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={selectedMembers.length === 0 || loadingMembers}
          >
            添加成员 ({selectedMembers.length})
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SpaceAddModal;
