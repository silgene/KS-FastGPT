import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  useToast,
  Input,
  IconButton,
  Flex
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { postCreateAndInviteTeamMember } from '@/web/support/user/team/api';
import { useUserStore } from '@/web/support/user/useUserStore';
import MyIcon from '@fastgpt/web/components/common/Icon';

interface DirectInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CreateUser {
  username: string;
  password: string;
}

const DirectInviteModal: React.FC<DirectInviteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { userInfo } = useUserStore();
  const teamId = userInfo?.team?.teamId || '';

  // 创建新用户的状态
  const [createUsers, setCreateUsers] = useState<CreateUser[]>([{ username: '', password: '' }]);
  const [createResult, setCreateResult] = useState<{
    created: Array<{ username: string; userId: string }>;
    failed: Array<{ username: string; error: string }>;
    alreadyExists: Array<{ username: string; userId: string }>;
  } | null>(null);

  // 创建并邀请新用户
  const { runAsync: handleCreateAndInvite, loading: createLoading } = useRequest2(
    async () => {
      const validUsers = createUsers.filter((user) => user.username.trim() && user.password.trim());

      if (validUsers.length === 0) {
        toast({
          title: t('account_team:create_users_required'),
          status: 'warning'
        });
        return;
      }

      const result = await postCreateAndInviteTeamMember({
        teamId,
        users: validUsers
      });

      setCreateResult(result);
      return result;
    },
    {
      onError: (error) => {
        toast({
          title: t('account_team:create_invite_failed'),
          description: error.message,
          status: 'error'
        });
      }
    }
  );

  const handleClose = () => {
    setCreateUsers([{ username: '', password: '' }]);
    setCreateResult(null);
    onClose();
  };

  const handleSuccess = () => {
    onSuccess?.();
    handleClose();
  };

  const addCreateUser = () => {
    setCreateUsers([...createUsers, { username: '', password: '' }]);
  };

  const removeCreateUser = (index: number) => {
    if (createUsers.length > 1) {
      setCreateUsers(createUsers.filter((_, i) => i !== index));
    }
  };

  const updateCreateUser = (index: number, field: keyof CreateUser, value: string) => {
    const updated = [...createUsers];
    updated[index][field] = value;
    setCreateUsers(updated);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="gray.600">
              {t('account_team:create_users_tip')}
            </Text>

            {createUsers.map((user, index) => (
              <Flex key={index} gap={2} align="end">
                <FormControl flex={1}>
                  <FormLabel fontSize="sm">{t('account_team:username')}</FormLabel>
                  <Input
                    value={user.username}
                    onChange={(e) => updateCreateUser(index, 'username', e.target.value)}
                    placeholder={t('account_team:username_placeholder')}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel fontSize="sm">{t('account_team:password')}</FormLabel>
                  <Input
                    type="password"
                    value={user.password}
                    onChange={(e) => updateCreateUser(index, 'password', e.target.value)}
                    placeholder={t('account_team:password_placeholder')}
                  />
                </FormControl>
                <IconButton
                  aria-label="Remove user"
                  icon={<MyIcon name="delete" />}
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => removeCreateUser(index)}
                  isDisabled={createUsers.length === 1}
                />
              </Flex>
            ))}

            <Button
              leftIcon={<MyIcon name="common/addLight" />}
              variant="outline"
              size="sm"
              onClick={addCreateUser}
              alignSelf="flex-start"
            >
              {t('account_team:add_user')}
            </Button>

            {createResult && (
              <Box>
                <Text fontWeight="bold" mb={2}>
                  {t('account_team:create_result')}
                </Text>
                <VStack spacing={2} align="stretch">
                  {createResult.created.length > 0 && (
                    <HStack>
                      <Badge colorScheme="green">
                        {t('account_team:create_success_count', {
                          count: createResult.created.length
                        })}
                      </Badge>
                      <Text fontSize="sm">
                        {createResult.created.map((u) => u.username).join(', ')}
                      </Text>
                    </HStack>
                  )}
                  {createResult.alreadyExists.length > 0 && (
                    <HStack>
                      <Badge colorScheme="yellow">
                        {t('account_team:user_exists_count', {
                          count: createResult.alreadyExists.length
                        })}
                      </Badge>
                      <Text fontSize="sm">
                        {createResult.alreadyExists.map((u) => u.username).join(', ')}
                      </Text>
                    </HStack>
                  )}
                  {createResult.failed.length > 0 && (
                    <VStack align="stretch" spacing={1}>
                      <HStack>
                        <Badge colorScheme="red">
                          {t('account_team:create_failed_count', {
                            count: createResult.failed.length
                          })}
                        </Badge>
                      </HStack>
                      {createResult.failed.map((fail, index) => (
                        <Text key={index} fontSize="sm" color="red.500">
                          {fail.username}: {fail.error}
                        </Text>
                      ))}
                    </VStack>
                  )}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            {t('common:Close')}
          </Button>
          {createResult && (
            <Button colorScheme="blue" mr={3} onClick={handleSuccess}>
              {t('common:Confirm')}
            </Button>
          )}
          <Button colorScheme="blue" onClick={handleCreateAndInvite} isLoading={createLoading}>
            {t('account_team:create_and_invite')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DirectInviteModal;
