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
import TeamAddMemberFromUser from './TeamAddMemberFromUser';
import TeamAddMemberCreateUser from './TeamAddMemberCreateUser';

enum AddTeamMemberTabEnum {
  fromUser = 'fromUser',
  addUser = 'addUser'
}

const TeamAddMemberModal = ({
  isOpen,
  teamId,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  teamId: string;
  onClose: () => void;
  onSuccess?: () => void;
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { userInfo } = useUserStore();

  const [addTeamMemberTab, setAddTeamMemberTab] = useState<AddTeamMemberTabEnum>(
    AddTeamMemberTabEnum.fromUser
  );
  const Tabs = useMemo(
    () => (
      <FillRowTabs
        w="fit-content"
        list={[
          { label: '从用户列表添加', value: AddTeamMemberTabEnum.fromUser },
          ...(userInfo?.systemPermission?.hasUserCreatePer
            ? [{ label: '新建用户并添加', value: AddTeamMemberTabEnum.addUser }]
            : [])
        ]}
        px={'1rem'}
        mb={2}
        value={addTeamMemberTab}
        onChange={(e) => {
          setAddTeamMemberTab(e);
        }}
      />
    ),
    [addTeamMemberTab, userInfo?.systemPermission?.hasUserCreatePer]
  );
  return (
    <MyModal
      isOpen={isOpen}
      onClose={onClose}
      iconSrc="modal/AddClb"
      title="添加用户到团队"
      minW="900px"
      maxW={'70vw'}
      h={'100%'}
      maxH={'90vh'}
      isCentered
      // isLoading={loadingMembers || loadingRoles}
    >
      <ModalBody flex={'1'} display={'flex'} flexDirection="column">
        {Tabs}
        {addTeamMemberTab === AddTeamMemberTabEnum.fromUser && (
          <TeamAddMemberFromUser
            teamId={teamId}
            onClose={onClose}
            onSuccess={onSuccess}
          ></TeamAddMemberFromUser>
        )}
        {addTeamMemberTab === AddTeamMemberTabEnum.addUser && (
          <TeamAddMemberCreateUser
            teamId={teamId}
            onClose={onClose}
            onSuccess={onSuccess}
          ></TeamAddMemberCreateUser>
        )}
      </ModalBody>
    </MyModal>
  );
};

export default TeamAddMemberModal;
