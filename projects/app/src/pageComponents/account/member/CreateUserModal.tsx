import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import RoleSelect from '@/components/support/user/role/RoleSelect';
import { getRoleList } from '@/web/support/user/role/api';
import { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import { createUser } from '@/web/support/user/api';

type CreateUserModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

const CreateUserModal = ({ onClose, onSuccess }: CreateUserModalProps) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    roleId: ''
  });

  const { data: myRoleList = [] } = useRequest2(() => getRoleList({ type: RoleTypeEnum.system }), {
    manual: false
  });

  const { runAsync: onCreateUser, loading: createUserLoading } = useRequest2(
    () => createUser(formData),
    {
      manual: true,
      onSuccess: () => {
        toast({
          title: '用户创建成功',
          status: 'success'
        });
        onSuccess();
        onClose();
      },
      onError: (error) => {
        toast({
          title: '用户创建失败',
          description: error.message,
          status: 'error'
        });
      }
    }
  );

  const handleSubmit = async () => {
    if (!formData.username || !formData.password || !formData.roleId) {
      toast({
        title: '请填写完整信息',
        status: 'warning'
      });
      return;
    }
    await onCreateUser();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Modal isOpen onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>创建用户</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>用户名</FormLabel>
              <Input
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="请输入用户名"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>密码</FormLabel>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="请输入密码"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>角色</FormLabel>
              <RoleSelect
                value={formData.roleId}
                onChange={(roleId) => handleInputChange('roleId', roleId)}
                myRoleList={myRoleList}
                w="100%"
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={createUserLoading}>
            创建
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateUserModal;
