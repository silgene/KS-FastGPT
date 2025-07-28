import { RoleStatusEnum, RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import { MongoRole } from './roleSchema';
import { RolePerResourceTypeMap } from '@fastgpt/global/support/user/role/controller';
import {
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { MongoTeam } from '../team/teamSchema';
import { MongoSpace } from '../space/spaceSchema';
import { MongoRoleUser } from './roleUser/roleUserSchema';
import { MongoTeamMember } from '../team/teamMemberSchema';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import type { RoleDetailType, RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import type { PaginationProps } from '@fastgpt/global/common/fetch/type';
/**
 * 获取角色列表
 * @param type 角色类型
 * @param customId 自定义ID
 * @returns 角色列表
 */
export const getRoleList = async ({
  type,
  status
}: {
  type?: RoleTypeEnum;
  status?: RoleStatusEnum;
}) => {
  const roles = await MongoRole.find({
    ...(type ? { type } : {}),
    ...(status ? { status: status } : {})
  })
    .sort({ createTime: -1, type: 1 })
    .lean();
  return roles;
};
/**
 * 获取某个团队成员对应角色类型的角色
 * @param type 角色类型
 * @param tmbId 团队成员ID
 * @param resourceId 资源ID (团队ID或空间ID)
 * @returns 角色详情
 */
export const getRoleByTmbId = async ({
  type,
  tmbId,
  resourceId
}: {
  type: RoleTypeEnum;
  tmbId: string;
  resourceId: string;
}): Promise<RoleDetailType> => {
  const roles = await MongoRole.find({
    type,
    status: RoleStatusEnum.active
  }).lean();
  // 看看是不是owner
  let isOwner = false;
  switch (type) {
    case RoleTypeEnum.team:
      const team = await MongoTeam.findOne({
        _id: resourceId,
        ownerId: tmbId
      });
      if (team) isOwner = true;
      break;

    case RoleTypeEnum.space:
      const space = await MongoSpace.findOne({
        _id: resourceId,
        ownerId: tmbId
      });
      if (space) isOwner = true;
      break;

    case RoleTypeEnum.system:
      // TODO: 补充系统角色权限
      break;
    default:
      break;
  }
  if (isOwner) {
    const role = roles.filter((role) => role.permission === OwnerPermissionVal)[0];
    return {
      ...role
    };
  }
  // 如果不是owner，则查找该用户的角色
  const tmb = await MongoTeamMember.findOne({
    _id: tmbId
  });
  if (!tmb) {
    return Promise.reject(TeamErrEnum.notUser);
  }
  const roleUser = await MongoRoleUser.findOne({
    userId: tmb.userId,
    type,
    status: RoleStatusEnum.active,
    ...(type === RoleTypeEnum.team ? { teamId: resourceId } : {}),
    ...(type === RoleTypeEnum.space ? { spaceId: resourceId } : {})
  })
    .populate<{ role: RoleSchemaType }>('role')
    .lean();
  if (!roleUser) {
    // TODO: 国际化配置
    return Promise.reject('没有找到角色');
  }
  return {
    ...roleUser.role
  };
};
