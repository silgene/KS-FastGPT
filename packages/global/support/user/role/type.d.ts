import type { PermissionValueType } from '../../../support/permission/type';
import { type RoleStatusEnum, type RoleTypeEnum } from './constant';

export type RoleSchemaType = {
  _id: string;
  name: string;
  type: `${RoleTypeEnum}`;
  status: `${RoleStatusEnum}`;
  permission: PermissionValueType;
  description: string;
  createTime: Date;
  tagColor: string; // 角色标签颜色
  defaultRole?: boolean; // 是否为系统自带角色
  ownerRole?: boolean; // 是否为所有者角色
};

export type RoleDetailType = RoleSchemaType & {};

// export type RoleUserSchemaType = {
//   _id: string;
//   roleId: string; // 角色ID
//   userId: string; // 用户ID

//   // 冗余字段,便于查询
//   type: `${RoleTypeEnum}`; // 角色类型
//   teamId?: string; // 团队ID (团队权限角色才有团队ID)
//   spaceId?: string; // 空间ID (空间权限角色才有空间ID)
//   status: `${RoleStatusEnum}`; // 状态

//   // 创建/更新时间
//   createTime: Date; // 创建时间
//   updateTime: Date; // 更新时间
// };
