import { TeamPermission } from '../../../support/permission/user/controller';
import { Permission } from '../../../support/permission/controller';
import { RoleStatusEnum, RoleTypeEnum } from './constant';
import { OwnerPermissionVal, PerResourceTypeEnum } from '../../../support/permission/constant';
import type { RoleDetailType, RoleSchemaType } from './type';
import type { PermissionValueType } from '../../../support/permission/type';

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
  permission: PermissionValueType
): RoleSchemaType => {
  // 返回一个自定义角色的数据
  return {
    _id: '',
    // TODO: 国际化
    name: '自定义角色',
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
    name: 'common:user.role.default.Team Member',
    type: RoleTypeEnum.team,
    status: RoleStatusEnum.active,
    // 对团队只读
    permission: 0b000100,
    description: 'common:user.role.default.Team Member Description',
    defaultRole: true
  },
  {
    // 团队所有者
    name: 'common:user.role.default.Team Owner',
    type: RoleTypeEnum.team,
    status: RoleStatusEnum.active,
    // 拥有所有权限
    permission: OwnerPermissionVal,
    description: 'common:user.role.default.Team Owner Description',
    defaultRole: true
  },
  {
    // 团队管理员
    name: 'common:user.role.default.Team Manager',
    type: RoleTypeEnum.team,
    status: RoleStatusEnum.active,
    // 拥有管理权限
    permission: 0b111111,
    description: 'common:user.role.default.Team Manager Description',
    defaultRole: true
  },
  {
    // 空间成员
    name: 'common:user.role.default.Space Member',
    type: RoleTypeEnum.space,
    status: RoleStatusEnum.active,
    // 对空间可读可写
    permission: 0b110,
    description: 'common:user.role.default.Space Member Description',
    defaultRole: true
  },
  {
    // 空间所有者
    name: 'common:user.role.default.Space Owner',
    type: RoleTypeEnum.space,
    status: RoleStatusEnum.active,
    // 对空间可以管理
    permission: OwnerPermissionVal,
    description: 'common:user.role.default.Space Owner Description',
    defaultRole: true
  },
  {
    // 空间管理员
    name: 'common:user.role.default.Space Manager',
    type: RoleTypeEnum.space,
    status: RoleStatusEnum.active,
    // 对空间可以管理
    permission: 0b111,
    description: 'common:user.role.default.Space Manager Description',
    defaultRole: true
  },
  {
    // 空间只读成员
    name: 'common:user.role.default.Space Reader',
    type: RoleTypeEnum.space,
    status: RoleStatusEnum.active,
    // 对空间只读
    permission: 0b100,
    description: 'common:user.role.default.Space Reader Description',
    defaultRole: true
  }
  // TODO: 后续可以添加系统角色
];
export type AddRoleModalFormType = {
  name: string;
  type: RoleTypeEnum;
  description: string;
};
