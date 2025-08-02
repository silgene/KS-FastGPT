import { RoleStatusEnum, RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import { MongoRole } from './roleSchema';
import {
  RolePerResourceTypeMap,
  type UpdateRoleType
} from '@fastgpt/global/support/user/role/controller';
import {
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { MongoTeam } from '../team/teamSchema';
import { MongoSpace } from '../space/spaceSchema';
import { MongoRoleUser } from './roleUser/roleUserSchema';
import { MongoTeamMember } from '../team/teamMemberSchema';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import type {
  RoleDetailType,
  RoleSchemaType,
  RoleUserSchemaType
} from '@fastgpt/global/support/user/role/type';
import type { PaginationProps } from '@fastgpt/global/common/fetch/type';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { type ClientSession } from 'mongoose';
import { MongoResourcePermission } from '../../../support/permission/schema';
import type { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
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

export const addRoleType = async ({
  type,
  name,
  description
}: {
  type: RoleTypeEnum;
  name: string;
  description: string;
}) => {
  const role = await MongoRole.create({
    type,
    name,
    description,
    permission: 0,
    defaultRole: false,
    ownerRole: false
  });
  return role;
};

export const updateRoleType = async ({
  roleId,
  permission,
  description,
  name,
  session
}: UpdateRoleType & {
  session: ClientSession;
}) => {
  console.log('Updating role with ID:', roleId, 'and permission:', permission);
  const role = await MongoRole.findOne({
    _id: roleId
  });
  if (!role) {
    return Promise.reject('角色不存在');
  }
  if (role.defaultRole) {
    return Promise.reject('不能修改系统角色');
  }

  const updatedRole = await MongoRole.findByIdAndUpdate(
    roleId,
    { permission, description, name },
    { new: true, session }
  ).lean();
  const roleUsers = await MongoRoleUser.find({
    roleId
  });
  const tmbs = await MongoTeamMember.find({
    userId: {
      $in: roleUsers.map((roleUser) => roleUser.userId)
    }
  });
  const tmbsMap = new Map<string, TeamMemberSchema>(tmbs.map((tmb) => [String(tmb.userId), tmb]));
  const needUpdateList = roleUsers
    .map((item) => {
      const tmbId = tmbsMap.get(String(item.userId))?._id;
      if (!tmbId || !item.userId) {
        return null;
      }
      let resourceId: string | undefined = undefined;
      if (item.type === RoleTypeEnum.team) {
        resourceId = item.teamId;
      } else if (item.type === RoleTypeEnum.space) {
        resourceId = item.spaceId;
      }
      return {
        updateOne: {
          filter: {
            tmbId,
            resourceType: item.type,
            resourceId
          },
          update: { permission }
        }
      };
    })
    .filter((item) => item !== null);
  await MongoResourcePermission.bulkWrite(needUpdateList, { session });
  if (!updatedRole) {
    throw new Error('角色不存在或更新失败');
  }
  return updatedRole;
};
