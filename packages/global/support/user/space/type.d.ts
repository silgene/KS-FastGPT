import { type SpacePermission } from '../../../support/permission/space/controller';
import type { SpaceTypeEnum } from './constant';
import { type TeamSchema } from '../team/type';
import type { TeamMemberRoleEnum, TeamMemberStatusEnum } from '../team/constant';
import type { GroupMemberRole } from '../../permission/memberGroup/constant';

export type SpaceSchemaType = {
  _id: string;
  name: string;
  teamId: string;
  avatar: string;
  createTime: Date;
  type: `${SpaceTypeEnum}`; // 个人空间或团队空间,个人空间只能有一个成员,团队空间可以有多个成员
  ownerId: string; // ownerId 为创建该空间的用户ID
  description?: string;
};

export type SpaceDetailType = SpaceSchemaType & {
  permission: SpacePermission;
  team: TeamSchema;
};

// 空间成员类型定义
export type SpaceMemberItemType<
  Options extends {
    withPermission?: boolean;
    withOrgs?: boolean;
    withGroupRole?: boolean;
  } = { withPermission: true; withOrgs: true; withGroupRole: false }
> = {
  _id: string; // 成员ID
  userId: string; // 用户ID
  teamId: string; // 团队ID
  name: string; // 成员名称（对应你数据中的 name 字段）
  avatar: string; // 头像
  role: `${TeamMemberRoleEnum}`; // 角色
  status: `${TeamMemberStatusEnum}`; // 状态
  createTime: Date; // 创建时间
  updateTime?: Date; // 更新时间（可选）
  contact?: string; // 联系方式（可选）
} & (Options extends { withPermission: true }
  ? {
      permission: SpacePermission;
    }
  : {}) &
  (Options extends { withOrgs: true }
    ? {
        orgs?: string[]; // full path name, pattern: /teamName/orgname1/orgname2
      }
    : {}) &
  (Options extends { withGroupRole: true }
    ? {
        groupRole?: `${GroupMemberRole}`;
      }
    : {});
