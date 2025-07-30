import AccountContainer from '@/pageComponents/account/AccountContainer';
import RoleManageContextProvider, {
  RoleManageContext
} from '@/pageComponents/account/role/context';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { serviceSideProps } from '@/web/common/i18n/utils';
import { useUserStore } from '@/web/support/user/useUserStore';
import { Box, Button, Flex } from '@chakra-ui/react';
import { RoleTypeNameMap, type RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import Icon from '@fastgpt/web/components/common/Icon';
import MyBox from '@fastgpt/web/components/common/MyBox';
import MyDivider from '@fastgpt/web/components/common/MyDivider';
import type { ParseKeys } from '@fastgpt/web/types/i18next';
import { useTranslation } from 'react-i18next';
import { useContextSelector } from 'use-context-selector';
import RoleDetail from '@/pageComponents/account/role/RoleDetail';
import Tag from '@fastgpt/web/components/common/Tag';
import { AddRoleModal } from '@/pageComponents/account/role/AddRoleModal';
import { useState } from 'react';

const RoleManage = () => {
  const { t } = useTranslation();
  const {
    loading,
    roleList,
    selectingRole,
    changeSelectingRole,
    roleListMap,
    selectingRoleEdit,
    saveRolePermission
  } = useContextSelector(RoleManageContext, (context) => context);
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);
  const [roleModalType, setRoleModalType] = useState<'add' | 'edit'>('add');

  return (
    <>
      <Flex flexDirection={'column'} flex={'1 0 0'} h={'100%'} overflow={'hidden'}>
        <Flex
          w={'100%'}
          h={'3.5rem'}
          px={'1.56rem'}
          py={'0.56rem'}
          borderBottom={'1px solid'}
          borderColor={'myGray.200'}
          bg={'myGray.25'}
          align={'center'}
          gap={6}
          justify={'space-between'}
        >
          <Flex align={'center'}>
            <Flex gap={2} color={'myGray.900'} alignItems={'center'}>
              <Icon name="support/user/usersLight" w={'1.25rem'} h={'1.25rem'} />
              <Box fontWeight={'500'} fontSize={'1rem'}>
                {t('account:role_manage')}
              </Box>
            </Flex>
          </Flex>
        </Flex>
        <MyBox isLoading={loading} flexGrow={1} px={'1rem'} display={'flex'} gap={4}>
          <Box
            flex={'1 0 0'}
            maxW={'150px'}
            display={'flex'}
            flexDirection={'column'}
            gap={1}
            overflowY={'auto'}
            justifyContent={'flex-start'}
            pt={'1rem'}
            flexBasis={'200px'}
          >
            <Button
              variant={'primary'}
              size="sm"
              borderRadius={'md'}
              mb={2}
              leftIcon={<MyIcon name={'common/addLight'} w={'1.2rem'} />}
              onClick={() => {
                setRoleModalType('add');
                setAddRoleModalOpen(true);
              }}
            >
              添加新角色
            </Button>
            {Object.keys(roleListMap).flatMap((type) => {
              const roles = roleListMap[type as RoleTypeEnum];
              if (!roles || roles.length === 0) return <></>;
              const typeNode = (
                <Box
                  key={RoleTypeNameMap[type as RoleTypeEnum] as ParseKeys}
                  color={'myGray.500'}
                  fontSize={12}
                  fontWeight={500}
                >
                  {t(RoleTypeNameMap[type as RoleTypeEnum] as ParseKeys)}
                </Box>
              );
              const roleNodes = roles.map((role) => {
                return (
                  <Button
                    variant={'ghost'}
                    key={role._id}
                    borderRadius={'md'}
                    _hover={{ bg: 'myGray.100' }}
                    fontSize={'13px'}
                    height={'22px'}
                    color={selectingRole?._id === role._id ? 'blue.500' : 'myGray.600'}
                    justifyContent={'flex-start'}
                    onClick={() => {
                      if (selectingRole?._id === role._id) return;
                      changeSelectingRole(role);
                    }}
                  >
                    {role.defaultRole ? t(role.name as ParseKeys) : role.name}
                  </Button>
                );
              });
              return [
                typeNode,
                ...roleNodes,
                <MyDivider
                  mt={0}
                  mb={2}
                  borderWidth={1}
                  w={'80%'}
                  mx={'auto'}
                  key={`divider-${type}`}
                />
              ];
            })}
          </Box>
          <MyDivider mt={0} orientation={'vertical'} />
          <Flex flexDir={'column'} flexGrow={1} py={'1rem'}>
            <Flex w={'100%'}>
              <Box>
                <Box fontWeight={'500'} color={'myGray.900'} mb={2}>
                  <Tag color={selectingRole?.tagColor} fontSize={'14px'}>
                    {selectingRole?.defaultRole
                      ? t(selectingRole?.name as ParseKeys)
                      : selectingRole?.name}
                  </Tag>
                </Box>

                <Box fontSize={'12px'} ml={2} color={'myGray.500'}>
                  {selectingRole?.defaultRole
                    ? t(selectingRole?.description as ParseKeys)
                    : selectingRole?.description || t('common:no_intro')}
                </Box>
              </Box>

              {selectingRole?.defaultRole ? (
                <></>
              ) : (
                <Flex gap={2} alignItems={'flex-end'} ml={'auto'} mb={1}>
                  <Button
                    variant={'solid'}
                    leftIcon={<MyIcon name={'edit'} w={'1rem'} />}
                    size={'sm'}
                    onClick={() => {
                      setRoleModalType('edit');
                      setAddRoleModalOpen(true);
                    }}
                  >
                    {t('common:Edit')}
                  </Button>
                  <Button
                    bg={'red.500'}
                    _hover={{
                      bg: 'red.400'
                    }}
                    leftIcon={<MyIcon name={'delete'} w={'1rem'} />}
                    size={'sm'}
                  >
                    {t('common:Delete')}
                  </Button>
                  {selectingRoleEdit && (
                    <Button
                      variant={'outline'}
                      leftIcon={<MyIcon name={'save'} w={'1rem'} />}
                      size={'sm'}
                      onClick={saveRolePermission} // 添加点击事件
                    >
                      {t('common:Save')}
                    </Button>
                  )}
                </Flex>
              )}
            </Flex>
            {/* <MyDivider mt={0} h={1} mb={4} /> */}

            <Box>
              <RoleDetail></RoleDetail>
            </Box>
          </Flex>
        </MyBox>
      </Flex>
      <AddRoleModal
        type={roleModalType}
        open={addRoleModalOpen}
        editRoleData={roleList.find((role) => role._id === selectingRole?._id)}
        setOpen={setAddRoleModalOpen}
      ></AddRoleModal>
    </>
  );
};

const RoleManagePage = () => {
  const { userInfo } = useUserStore();

  return userInfo?.team ? (
    <AccountContainer>
      <RoleManageContextProvider>
        <RoleManage></RoleManage>
      </RoleManageContextProvider>
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

export default RoleManagePage;
