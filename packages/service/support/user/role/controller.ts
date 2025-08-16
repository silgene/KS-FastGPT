import { RoleStatusEnum, RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import { MongoRole } from './roleSchema';
import {
  getCustomRole,
  RolePerResourceTypeMap,
  type UpdateRoleType
} from '@fastgpt/global/support/user/role/controller';
import {
  NullPermission,
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { MongoTeam } from '../team/teamSchema';
import { MongoSpace } from '../space/spaceSchema';

import { MongoTeamMember } from '../team/teamMemberSchema';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import type { RoleDetailType, RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import type { PaginationProps } from '@fastgpt/global/common/fetch/type';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { type ClientSession } from 'mongoose';
import { MongoResourcePermission } from '../../../support/permission/schema';
import type { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
import { MongoSpaceMember } from '../space/spaceMemberSchema';
import { MongoUser } from '../schema';
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
  resourceId?: string;
}): Promise<RoleSchemaType> => {
  const role = await (async () => {
    switch (type) {
      case RoleTypeEnum.space:
        const spaceMember = await MongoSpaceMember.findOne({
          tmbId,
          spaceId: resourceId
        })
          .populate<{ role: RoleSchemaType }>('role')
          .lean();
        return spaceMember?.role;
      case RoleTypeEnum.team:
        const tmb = await MongoTeamMember.findOne({
          _id: tmbId,
          teamId: resourceId
        })
          .populate<{ role: RoleSchemaType }>('role')
          .lean();
        return tmb?.role;
      case RoleTypeEnum.system:
        const userTmb = await MongoTeamMember.findOne({ _id: tmbId })
          .populate<{ user: { role: RoleSchemaType } }>({
            path: 'user',
            select: 'roleId',
            populate: {
              path: 'role'
            }
          })
          .lean();
        return userTmb?.user?.role;
    }
  })();
  return role || getCustomRole(RoleTypeEnum.team, NullPermission, '无角色');
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

export const updateRole = async ({
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

  if (!updatedRole) {
    throw new Error('角色不存在或更新失败');
  }
  return updatedRole;
};
export const updateMemberRole = async ({
  type,
  teamId,
  spaceId,
  tmbId,
  roleId
}: {
  type: RoleTypeEnum;
  teamId?: string;
  spaceId?: string;
  tmbId: string;
  roleId: string;
}) => {
  const tmb = await MongoTeamMember.findOne({ _id: tmbId });
  if (!tmb) {
    return Promise.reject('团队成员不存在');
  }
  const role = await MongoRole.findOne({
    _id: roleId,
    type,
    status: RoleStatusEnum.active
  });
  if (!role) {
    return Promise.reject('角色不存在');
  }
  switch (type) {
    case RoleTypeEnum.space:
      await MongoSpaceMember.findOneAndUpdate({ tmbId, spaceId }, { roleId });
      break;
    case RoleTypeEnum.team:
      await MongoTeamMember.findOneAndUpdate({ _id: tmbId, teamId }, { roleId });
      break;
    case RoleTypeEnum.system:
      await MongoUser.findOneAndUpdate({ _id: tmb.userId }, { roleId });
      break;
  }
};
export const getDefaultOwnerRole = async (type: RoleTypeEnum) => {
  const ownerRole = await MongoRole.findOne({
    type,
    ownerRole: true,
    defaultRole: true
  }).lean();
  if (!ownerRole) {
    throw Promise.reject('默认所有者角色不存在,请重新添加');
  }
  return ownerRole;
};
