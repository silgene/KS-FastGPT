import { useSelectFile } from '@/web/common/file/hooks/useSelectFile';
import { addTeamSpace, updateTeamSpaceInfo } from '@/web/support/user/space/api';
import { Box, Button, HStack, Input, ModalBody, ModalFooter, Textarea } from '@chakra-ui/react';
import type { AddUpdateSpacePropsType } from '@fastgpt/global/support/user/space/controller';
import type { SpaceSchemaType } from '@fastgpt/global/support/user/space/type';
import Avatar from '@fastgpt/web/components/common/Avatar';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';
import MyModal from '@fastgpt/web/components/common/MyModal';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const SpaceAddModal = ({
  onClose,
  type,
  spaceInfo,
  onSuccess
}: {
  type: 'add' | 'edit';
  onClose: () => void;
  spaceInfo?: SpaceSchemaType | null;
  onSuccess?: () => void;
}) => {
  const { t } = useTranslation();
  const { register, watch, setValue, handleSubmit } = useForm<AddUpdateSpacePropsType>({
    defaultValues: {
      name: '',
      description: '',
      avatar: ''
    }
  });
  useEffect(() => {
    if (type === 'add') {
      setValue('_id', '');
      setValue('name', '');
      setValue('description', '');
      setValue('avatar', '');
    } else if (type === 'edit' && spaceInfo) {
      setValue('_id', spaceInfo._id);
      setValue('name', spaceInfo.name);
      setValue('description', spaceInfo.description);
      setValue('avatar', spaceInfo.avatar);
    }
  }, [type, spaceInfo, setValue]);
  const avatar = watch('avatar');
  const {
    File,
    onOpen: onOpenSelectFile,
    onSelectImage
  } = useSelectFile({
    fileType: '.jpg,.png',
    multiple: false
  });
  const { runAsync: onSave, loading } = useRequest2(
    async (data: AddUpdateSpacePropsType) => {
      if (type === 'add') {
        return addTeamSpace(data);
      } else if (type === 'edit') {
        return updateTeamSpaceInfo(data);
      }
    },
    {
      manual: true,
      onSuccess: (res) => {
        onSuccess?.();
        onClose();
      }
    }
  );
  return (
    <MyModal
      isOpen
      onClose={onClose}
      iconSrc={type === 'add' ? 'common/addCircleLight' : 'common/edit'}
      title={type === 'add' ? '添加空间' : '编辑空间'}
    >
      <ModalBody>
        <Box>
          <FormLabel mb={1}>{t('common:core.app.Name and avatar')}</FormLabel>
          <HStack spacing={4}>
            <MyTooltip label={t('common:set_avatar')}>
              <Avatar
                flex={'0 0 2rem'}
                src={avatar}
                w={'2rem'}
                h={'2rem'}
                cursor={'pointer'}
                borderRadius={'sm'}
                onClick={onOpenSelectFile}
              />
            </MyTooltip>
            <Input
              {...register('name', { required: true })}
              bg={'myGray.50'}
              autoFocus
              maxLength={100}
            />
          </HStack>
        </Box>
        <Box mt={4}>
          <FormLabel mb={1}>{t('common:Intro')}</FormLabel>
          <Textarea {...register('description')} bg={'myGray.50'} maxLength={200} />
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button isLoading={loading} onClick={handleSubmit(onSave)} px={6}>
          {t('common:Confirm')}
        </Button>
      </ModalFooter>

      <File
        onSelect={(e) =>
          onSelectImage(e, {
            maxH: 300,
            maxW: 300,
            callback: (e) => setValue('avatar', e)
          })
        }
      />
    </MyModal>
  );
};
export default SpaceAddModal;
