import { NullPermission, PermissionKeyEnum, PermissionList } from '../constant';
import { type PermissionListType } from '../type';
import { i18nT } from '../../../../web/i18n/utils';
export enum SpacePermissionKeyEnum {
  // 应用相关权限
  appRead = 'appRead', // 查看/使用应用
  appCreate = 'appCreate', // 修改/创建应用
  appManage = 'appManage', // 管理应用

  // 知识库相关权限
  datasetRead = 'datasetRead', // 查看/使用知识库
  datasetCreate = 'datasetCreate', // 修改/创建知识库
  datasetManage = 'datasetManage', // 管理知识库

  // 成员管理权限
  memberRead = 'memberRead', // 查看成员
  memberManage = 'memberManage', // 管理成员
  memberAdmin = 'memberAdmin', // 添加管理员
  memberInvite = 'memberInvite' // 邀请成员
}
export type SpacePermissionListType = PermissionListType<SpacePermissionKeyEnum, false>;

export const SpacePermissionList: SpacePermissionListType = {
  // 应用相关权限 (位 3-5)
  [SpacePermissionKeyEnum.appRead]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_appRead'),
    value: 0b000001000
  },
  [SpacePermissionKeyEnum.appCreate]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_appCreate'),
    value: 0b000010000
  },
  [SpacePermissionKeyEnum.appManage]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_appManage'),
    value: 0b000100000
  },

  // 知识库相关权限 (位 6-8)
  [SpacePermissionKeyEnum.datasetRead]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_datasetRead'),
    value: 0b001000000
  },
  [SpacePermissionKeyEnum.datasetCreate]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_datasetCreate'),
    value: 0b010000000
  },
  [SpacePermissionKeyEnum.datasetManage]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_datasetManage'),
    value: 0b100000000
  },

  // 成员管理权限 (位 9-12)
  [SpacePermissionKeyEnum.memberRead]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_memberRead'),
    value: 0b0001000000000
  },
  [SpacePermissionKeyEnum.memberManage]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_memberManage'),
    value: 0b0010000000000
  },
  [SpacePermissionKeyEnum.memberAdmin]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_memberAdmin'),
    value: 0b0100000000000
  },
  [SpacePermissionKeyEnum.memberInvite]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_memberInvite'),
    value: 0b1000000000000
  }
};

export const SpaceAppReadPermissionVal = SpacePermissionList[SpacePermissionKeyEnum.appRead].value;
export const SpaceAppCreatePermissionVal =
  SpacePermissionList[SpacePermissionKeyEnum.appCreate].value;
export const SpaceAppManagePermissionVal =
  SpacePermissionList[SpacePermissionKeyEnum.appManage].value;
export const SpaceDatasetReadPermissionVal =
  SpacePermissionList[SpacePermissionKeyEnum.datasetRead].value;
export const SpaceDatasetCreatePermissionVal =
  SpacePermissionList[SpacePermissionKeyEnum.datasetCreate].value;
export const SpaceDatasetManagePermissionVal =
  SpacePermissionList[SpacePermissionKeyEnum.datasetManage].value;
export const SpaceMemberReadPermissionVal =
  SpacePermissionList[SpacePermissionKeyEnum.memberRead].value;
export const SpaceMemberManagePermissionVal =
  SpacePermissionList[SpacePermissionKeyEnum.memberManage].value;
export const SpaceMemberAdminPermissionVal =
  SpacePermissionList[SpacePermissionKeyEnum.memberAdmin].value;
export const SpaceMemberInvitePermissionVal =
  SpacePermissionList[SpacePermissionKeyEnum.memberInvite].value;
export const SpaceDefaultPermissionVal = NullPermission;
