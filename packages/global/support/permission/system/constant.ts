import { i18nT } from '../../../../web/i18n/utils';
import { NullPermission } from '../constant';
import type { PermissionBaseListType } from '../type';

// 系统级别的管理权限
export enum SystemPermissionKeyEnum {
  // 管理系统中所有团队
  teamManage = 'teamManage',
  // 创建团队
  teamCreate = 'teamCreate',
  // 管理所有用户
  userManage = 'userManage',
  // 创建新用户
  userCreate = 'userCreate',
  // 管理模型设置
  modelManage = 'modelManage',
  // 查看系统日志
  systemLogRead = 'systemLogRead',
  // 管理智能体中心
  agentStoreManage = 'agentStoreManage',
  // 管理前台
  frontManage = 'frontManage'
}
export type SystemPermissionListType = PermissionBaseListType<SystemPermissionKeyEnum>;
export const SystemPermissionList: SystemPermissionListType = {
  // 团队相关权限
  [SystemPermissionKeyEnum.teamManage]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_teamManage'),
    value: 0b00000001
  },
  [SystemPermissionKeyEnum.teamCreate]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_teamCreate'),
    value: 0b00000010
  },
  // 用户相关权限
  [SystemPermissionKeyEnum.userManage]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_userManage'),
    value: 0b00000100
  },
  [SystemPermissionKeyEnum.userCreate]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_userCreate'),
    value: 0b00001000
  },
  // 模型相关权限
  [SystemPermissionKeyEnum.modelManage]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_modelManage'),
    value: 0b00010000
  },
  // 系统日志相关权限
  [SystemPermissionKeyEnum.systemLogRead]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_systemLogRead'),
    value: 0b00100000
  },
  // 智能体中心相关权限
  [SystemPermissionKeyEnum.agentStoreManage]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_agentStoreManage'),
    value: 0b01000000
  },
  // 前台相关权限
  [SystemPermissionKeyEnum.frontManage]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_frontManage'),
    value: 0b10000000
  }
};
export const SystemTeamManagePermissionVal =
  SystemPermissionList[SystemPermissionKeyEnum.teamManage].value;
export const SystemTeamCreatePermissionVal =
  SystemPermissionList[SystemPermissionKeyEnum.teamCreate].value;
export const SystemUserManagePermissionVal =
  SystemPermissionList[SystemPermissionKeyEnum.userManage].value;
export const SystemUserCreatePermissionVal =
  SystemPermissionList[SystemPermissionKeyEnum.userCreate].value;
export const SystemModelManagePermissionVal =
  SystemPermissionList[SystemPermissionKeyEnum.modelManage].value;
export const SystemReadLogPermissionVal =
  SystemPermissionList[SystemPermissionKeyEnum.systemLogRead].value;
export const SystemAgentStoreManagePermissionVal =
  SystemPermissionList[SystemPermissionKeyEnum.agentStoreManage].value;
export const SystemFrontManagePermissionVal =
  SystemPermissionList[SystemPermissionKeyEnum.frontManage].value;
export const SystemDefaultPermissionVal = NullPermission;
