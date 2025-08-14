import { NullPermission, PermissionKeyEnum } from '../constant';
import type { PermissionBaseListType, PermissionListType } from '../type';
import { PermissionList } from '../constant';
import { i18nT } from '../../../../web/i18n/utils';
export enum TeamPermissionKeyEnum {
  // 管理team下的所有space
  spaceManage = 'spaceManage',
  // 邀请团队成员
  inviteTeamMember = 'inviteTeamMember',
  // 管理团队成员
  manageMember = 'manageMember'
}

export const TeamPermissionList: PermissionBaseListType<TeamPermissionKeyEnum> = {
  [TeamPermissionKeyEnum.spaceManage]: {
    name: i18nT('account_team:permission_spaceManage'),
    description: i18nT('account_team:permission_spaceManage description'),
    value: 0b001,
    checkBoxType: 'single'
  },
  [TeamPermissionKeyEnum.inviteTeamMember]: {
    name: i18nT('account_team:inviteTeamMember'),
    description: i18nT('account_team:inviteTeamMember description'),
    value: 0b010,
    checkBoxType: 'single'
  },
  [TeamPermissionKeyEnum.manageMember]: {
    name: i18nT('account_team:manageMember'),
    description: i18nT('account_team:manageMember description'),
    value: 0b100,
    checkBoxType: 'single'
  }
};

// export const TeamReadPermissionVal = TeamPermissionList['read'].value;
// export const TeamWritePermissionVal = TeamPermissionList['write'].value;
// export const TeamManagePermissionVal = TeamPermissionList['manage'].value;
// export const TeamAppCreatePermissionVal = TeamPermissionList['appCreate'].value;
// export const TeamDatasetCreatePermissionVal = TeamPermissionList['datasetCreate'].value;
// export const TeamApikeyCreatePermissionVal = TeamPermissionList['apikeyCreate'].value;
export const TeamSpaceManagePermissionVal = TeamPermissionList['spaceManage'].value;
export const TeamInviteTeamMemberPermissionVal = TeamPermissionList['inviteTeamMember'].value;
export const TeamManageMemberPermissionVal = TeamPermissionList['manageMember'].value;
export const TeamDefaultPermissionVal = NullPermission;
