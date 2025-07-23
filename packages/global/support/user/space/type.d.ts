import { type SpacePermission } from 'support/permission/space/controller';
import type { SpaceTypeEnum } from './constant';
import { type TeamSchema } from '../team/type';

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
