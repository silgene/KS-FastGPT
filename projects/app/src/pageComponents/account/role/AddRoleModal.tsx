import { addRole } from '@/web/support/user/role/api';
import {
  Box,
  Button,
  Flex,
  Input,
  ModalBody,
  ModalFooter,
  Radio,
  Textarea
} from '@chakra-ui/react';
import { RoleTypeEnum, RoleTypeNameMap } from '@fastgpt/global/support/user/role/constant';
import { type AddRoleModalFormType } from '@fastgpt/global/support/user/role/controller';
import MyIconButton from '@fastgpt/web/components/common/Icon/button';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';
import MyModal from '@fastgpt/web/components/common/MyModal';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import RadioGroup from '@fastgpt/web/components/common/Radio/RadioGroup';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type AddRoleModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};
export const AddRoleModal = ({ open, setOpen }: AddRoleModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const radioGroupList = Object.keys(RoleTypeNameMap).map((type) => {
    return {
      title: RoleTypeNameMap[type as RoleTypeEnum],
      value: type
    };
  });
  const { register, handleSubmit, formState, watch, setValue } = useForm<AddRoleModalFormType>({
    defaultValues: {
      name: '',
      type: RoleTypeEnum.space,
      description: ''
    }
  });
  const { run: onSubmit, loading } = useRequest2(
    async (data: AddRoleModalFormType) => {
      await addRole(data);
    },
    {
      onSuccess: (res) => {
        setOpen(false);
        toast({
          title: '添加成功',
          status: 'success'
        });
      }
    }
  );
  const roleType = watch('type');
  return (
    <MyModal
      isOpen={open}
      iconSrc="common/userInfo"
      title={
        <Flex alignItems={'center'}>
          <Box mr={1}>添加角色</Box>
          <MyTooltip label={'角色创建后默认为无权限角色,请手动为其添加权限'}>
            <MyIconButton icon="common/info"></MyIconButton>
          </MyTooltip>
        </Flex>
      }
    >
      <ModalBody>
        <Box>
          <FormLabel mb={1}>角色类型</FormLabel>
          <RadioGroup
            list={radioGroupList}
            value={roleType}
            onChange={(val) => setValue('type', val as RoleTypeEnum)}
          ></RadioGroup>
        </Box>
        <Box mt={4}>
          <FormLabel mb={1}>角色名称</FormLabel>
          <Input {...register('name')}></Input>
        </Box>
        <Box mt={4}>
          <FormLabel mb={1}>角色描述</FormLabel>
          <Textarea {...register('description')} bg={'myGray.50'} maxLength={200} />
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button
          variant={'outline'}
          mr={3}
          onClick={() => {
            setOpen(false);
          }}
        >
          {t('common:Cancel')}
        </Button>
        <Button isLoading={loading} onClick={handleSubmit(onSubmit)}>
          {t('common:Confirm')}
        </Button>
      </ModalFooter>
    </MyModal>
  );
};
