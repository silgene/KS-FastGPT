import { type SpacePermission } from '../../../support/permission/space/controller';
import type { SpaceMemberStatusEnum, SpaceTypeEnum } from './constant';
import { type TeamMemberSchema, type TeamSchema } from '../team/type';
import type { TeamMemberRoleEnum, TeamMemberStatusEnum } from '../team/constant';
import type { GroupMemberRole } from '../../permission/memberGroup/constant';
import type { RoleDetailType } from '../role/type';

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
export type SpaceMemberSchemaType = {
  _id: string;
  roleId: string;
  tmbId: string; // 团队成员ID
  spaceId: string; // 空间ID
  status: `${SpaceMemberStatusEnum}`; // 成员状态
};

export type SpaceMemberItemType = Omit<TeamMemberSchema, 'role'> & {
  role: RoleDetailType;
  username: string;
  status: `${SpaceMemberStatusEnum}`; // 成员状态
};
