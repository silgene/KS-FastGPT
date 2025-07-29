import { NullPermission, PermissionKeyEnum, PermissionList } from '../constant';
import { type PermissionListType } from '../type';
import { i18nT } from '../../../../web/i18n/utils';
export enum SpacePermissionKeyEnum {}
// TODO: 需要添加更多权限
// // 可编辑应用
// writeApp = 'writeApp',
// // 可编辑数据集
// writeDataset = 'writeDataset'

export const SpacePermissionList: PermissionListType = {
  [PermissionKeyEnum.read]: {
    ...PermissionList[PermissionKeyEnum.read],
    description: i18nT('space:permission.des.read')
  },
  [PermissionKeyEnum.write]: {
    ...PermissionList[PermissionKeyEnum.write],
    description: i18nT('space:permission.des.write')
  },
  [PermissionKeyEnum.manage]: {
    ...PermissionList[PermissionKeyEnum.manage],
    description: i18nT('space:permission.des.manage')
  }
};
export const SpaceManagePermissionVal = SpacePermissionList[PermissionKeyEnum.manage].value;
export const SpaceWritePermissionVal = SpacePermissionList[PermissionKeyEnum.write].value;
export const SpaceReadPermissionVal = SpacePermissionList[PermissionKeyEnum.read].value;
export const SpaceDefaultPermissionVal = NullPermission;
