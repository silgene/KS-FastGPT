import { TeamPermission } from '../../../support/permission/user/controller';
import { Permission } from '../../../support/permission/controller';
import { RoleStatusEnum, RoleTypeEnum } from './constant';
import { OwnerPermissionVal, PerResourceTypeEnum } from '../../../support/permission/constant';
import type { RoleDetailType, RoleSchemaType } from './type';
import type { PermissionValueType } from '../../../support/permission/type';
import { i18nT } from '../../../../web/i18n/utils';

export const RolePermissionMap = {
  [RoleTypeEnum.space]: {
    name: '',
    description: '',
    permissionClass: Permission
  },
  [RoleTypeEnum.team]: {
    name: '',
    description: '',
    permissionClass: TeamPermission
  }
};
export const RolePerResourceTypeMap: Record<RoleTypeEnum, `${PerResourceTypeEnum}`> = {
  [RoleTypeEnum.space]: PerResourceTypeEnum.space,
  [RoleTypeEnum.team]: PerResourceTypeEnum.team,
  [RoleTypeEnum.system]: PerResourceTypeEnum.system
};

export const getCustomRole = (
  type: RoleTypeEnum,
  permission: PermissionValueType,
  name: string = '自定义角色'
): RoleSchemaType => {
  // 返回一个自定义角色的数据
  return {
    _id: '',
    // TODO: 国际化
    name,
    type,
    status: RoleStatusEnum.active,
    permission,
    description: '',
    createTime: new Date(),
    tagColor: '#1677ff',
    defaultRole: false
  };
};
// 系统自带的默认角色
export const DefaultRoleList = [
  {
    // 团队成员
    _id: '688698578d3f3ecf1eed0ee1',
    name: i18nT('common:user.role.default.Team Member'),
    type: RoleTypeEnum.team,
    status: RoleStatusEnum.active,
    // 对团队只读
    permission: 0b000000,
    description: i18nT('common:user.role.default.Team Member Description'),
    defaultRole: true
  },
  {
    // 团队所有者
    _id: '688698578d3f3ecf1eed0f10',
    name: i18nT('common:user.role.default.Team Owner'),
    type: RoleTypeEnum.team,
    status: RoleStatusEnum.active,
    // 拥有所有权限
    permission: OwnerPermissionVal,
    description: i18nT('common:user.role.default.Team Owner Description'),
    defaultRole: true,
    ownerRole: true
  },
  {
    _id: '688698578d3f3ecf1eed0f28',
    // 团队管理员
    name: i18nT('common:user.role.default.Team Manager'),
    type: RoleTypeEnum.team,
    status: RoleStatusEnum.active,
    // 拥有管理权限
    permission: 0b111111,
    description: i18nT('common:user.role.default.Team Manager Description'),
    defaultRole: true
  },
  {
    // 空间成员
    _id: '688698578d3f3ecf1eed0f37',
    name: i18nT('common:user.role.default.Space Member'),
    type: RoleTypeEnum.space,
    status: RoleStatusEnum.active,
    // 对空间智能体，知识库可读可写
    permission: 0b0001011011000,
    description: i18nT('common:user.role.default.Space Member Description'),
    defaultRole: true
  },
  {
    // 空间所有者
    _id: '688698578d3f3ecf1eed0f41',
    name: i18nT('common:user.role.default.Space Owner'),
    type: RoleTypeEnum.space,
    status: RoleStatusEnum.active,
    // 对空间可以管理
    permission: OwnerPermissionVal,
    description: i18nT('common:user.role.default.Space Owner Description'),
    defaultRole: true,
    ownerRole: true
  },
  {
    // 空间管理员
    _id: '688698578d3f3ecf1eed0f46',
    name: i18nT('common:user.role.default.Space Manager'),
    type: RoleTypeEnum.space,
    status: RoleStatusEnum.active,
    // 对空间可以管理
    permission: 0b1111111111000,
    description: i18nT('common:user.role.default.Space Manager Description'),
    defaultRole: true
  },
  {
    // 空间只读成员
    _id: '688698578d3f3ecf1eed0f4b',
    name: i18nT('common:user.role.default.Space Reader'),
    type: RoleTypeEnum.space,
    status: RoleStatusEnum.active,
    // 对空间只读
    permission: 0b0001001001000,
    description: i18nT('common:user.role.default.Space Reader Description'),
    defaultRole: true
  },
  {
    // 系统超级管理员
    _id: '689f416598878b78042d5762',
    name: i18nT('common:user.role.default.System Admin'),
    type: RoleTypeEnum.system,
    status: RoleStatusEnum.active,
    permission: OwnerPermissionVal,
    description: i18nT('common:user.role.default.System Admin Description'),
    defaultRole: true
  },
  {
    // 普通成员
    _id: '689f416598878b78042d5798',
    name: i18nT('common:user.role.default.System Member'),
    type: RoleTypeEnum.system,
    status: RoleStatusEnum.active,
    permission: 0b0,
    description: i18nT('common:user.role.default.System Member Description'),
    defaultRole: true
  }
];
export type AddRoleModalFormType = {
  name: string;
  type: RoleTypeEnum;
  description: string;
};
export type UpdateRoleType = {
  roleId: string;
  permission: PermissionValueType;
  name?: string;
  description?: string;
  tagColor?: string;
};
export type UpdateMemberRoleRequestType = {
  type: RoleTypeEnum;
  roleId: string;
  teamId?: string;
  spaceId?: string;
  tmbId?: string;
  userId?: string;
};
