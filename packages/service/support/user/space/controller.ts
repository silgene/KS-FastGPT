import { SpaceTypeEnum } from '@fastgpt/global/support/user/space/constant';
import { Types, type ClientSession } from 'mongoose';
import { MongoSpace } from './spaceSchema';
import { MongoTeamMember } from '../team/teamMemberSchema';
import type { TeamMemberSchema, TeamSchema } from '@fastgpt/global/support/user/team/type';
import { MongoResourcePermission } from '../../permission/schema';
import {
  PerResourceTypeEnum,
  ReadPermissionVal
} from '@fastgpt/global/support/permission/constant';
import team, { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { SpacePermission } from '@fastgpt/global/support/permission/space/controller';
import type {
  SpaceDetailType,
  SpaceMemberItemType,
  SpaceSchemaType
} from '@fastgpt/global/support/user/space/type';
import { MongoRoleUser } from '../role/roleUser/roleUserSchema';
import { RoleCollectionName, RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import { getCustomRole } from '@fastgpt/global/support/user/role/controller';
import type { PaginationProps, PaginationResponse } from '@fastgpt/global/common/fetch/type';
import { getRoleByTmbId } from '../role/controller';
import { MongoRole } from '../role/roleSchema';
import { SpaceErrEnum } from '@fastgpt/global/common/error/code/space';
import type {
  AddMembersPropsType,
  AddUpdateSpacePropsType
} from '@fastgpt/global/support/user/space/controller';

// 获取空间中成员的列表
export const getSpaceMemberList = async ({
  spaceId,
  pageSize,
  offset
}: PaginationProps<{ spaceId: string }>): Promise<PaginationResponse<SpaceMemberItemType>> => {
  // 在调用这个函数前需要鉴权是否有空间权限
  const space = await MongoSpace.findOne({ _id: spaceId })
    .populate<{ tmb: TeamMemberSchema & { user: { username: string } } }>({
      path: 'tmb',
      populate: {
        path: 'user',
        select: 'username'
      }
    })
    .lean();
  if (!space) {
    return Promise.reject('空间不存在');
  }
  // 只有团队空间才可以有多个成员,个人空间直接返回自身即可
  if (space.type === SpaceTypeEnum.personal) {
    const role = await getRoleByTmbId({
      type: RoleTypeEnum.space,
      resourceId: spaceId,
      tmbId: space.ownerId
    });
    return { total: 1, list: [{ ...space.tmb, role, username: space.tmb.user.username }] };
  }
  // 因为owner不在MongoRoleUser中，在分页查询时排除掉owner,但返回时需要考虑owner
  // 应该不需要考虑offset=1的情况
  const skip = Math.max(Number(offset) - 1, 0);
  const limit = (() => {
    // 因为多表查询的性能,分页查询最高100个
    const res = Math.min(Number(pageSize), 100);
    if (offset === 0) return res - 1;
    return res;
  })();

  const roleUsers = (
    await MongoRoleUser.find({
      type: RoleTypeEnum.space,
      spaceId
    })
      .populate<{ role: RoleSchemaType }>(RoleCollectionName)
      .limit(limit)
      .skip(skip)
      .lean()
  ).map((item) => {
    return { ...item, permission: new SpacePermission({ per: item.role.permission }) };
  });
  const total =
    (await MongoRoleUser.countDocuments({
      type: RoleTypeEnum.space,
      spaceId
    })) + 1; // +1是因为owner不在roleUser中
  // 查询这个空间中所有角色的用户(tmb)
  const tmbs = await MongoTeamMember.find({
    userId: { $in: roleUsers.map((item) => item.userId) },
    teamId: space.teamId
  })
    .populate<{ user: { username: string } }>({
      path: 'user',
      select: 'username'
    })
    .lean();

  const roleUserMap = new Map<string, (typeof roleUsers)[0]>(
    roleUsers.map((roleUser) => [String(roleUser.userId), roleUser])
  );
  const spaceOwner = {
    ...space.tmb,
    role: await getRoleByTmbId({
      type: RoleTypeEnum.space,
      resourceId: spaceId,
      tmbId: space.ownerId
    }),
    username: space.tmb.user.username
  };
  const tmbList = [
    // 空间创建者
    ...(skip === 0 ? [spaceOwner] : []),
    // 合并对这个空间有权限的团队成员 和 在这个空间有角色的成员(以权限为主导)
    ...tmbs.map((tmb) => {
      return {
        ...tmb,
        username: tmb.user?.username || tmb.name,
        role: roleUserMap.get(String(tmb.userId))!.role
      };
    })
  ];

  return { total, list: tmbList };
};

// 创建默认个人空间(每个个人空间都依托于单个团队)
export const createDefaultPersonalSpace = async ({
  tmbId,
  name = '个人空间',
  avatar = '/icon/logo.svg',
  session
}: {
  tmbId: string;
  name: string;
  avatar?: string;
  session?: ClientSession;
}) => {
  // 如果个人空间已存在，则不创建
  const space = await MongoSpace.findOne({
    tmbId,
    type: SpaceTypeEnum.personal
  });
  if (space) {
    session?.abortTransaction();
    throw Promise.reject('个人空间已存在');
  }
  const tmb = await MongoTeamMember.findOne({ tmbId }).lean();
  if (!tmb) {
    session?.abortTransaction();
    throw Promise.reject('团队成员不存在');
  }
  // 创建个人空间
  const [{ _id: insertedId }] = await MongoSpace.create(
    [
      {
        name,
        avatar,
        teamId: tmb.teamId,
        type: SpaceTypeEnum.personal,
        createTime: new Date(),
        ownerId: tmbId
      }
    ],
    { session }
  );
  return insertedId;
};

// 创建团队空间
export const addTeamSpace = async ({
  name,
  teamId,
  tmbId,
  avatar = '/icon/logo.svg',
  description = '',
  session
}: AddUpdateSpacePropsType & {
  tmbId: string;
  teamId: string;
  session?: ClientSession;
}) => {
  const [space] = await MongoSpace.create(
    [
      {
        name,
        avatar,
        teamId: teamId,
        type: SpaceTypeEnum.team,
        createTime: new Date(),
        ownerId: tmbId,
        description
      }
    ],
    { session }
  );
  return space as SpaceSchemaType;
};
// 修改团队空间的信息,需要是该空间的所有者
export const updateTeamSpaceInfo = async ({
  _id: spaceId,
  name,
  avatar = '/icon/logo.svg',
  description = '',
  session
}: AddUpdateSpacePropsType & {
  session: ClientSession;
}) => {
  await MongoSpace.updateOne(
    {
      _id: spaceId
    },
    {
      name,
      avatar,
      description
    },
    {
      session
    }
  );
};

// 获取某个团队成员的空间列表
export const getSpaceList = async (tmbId: string): Promise<SpaceDetailType[]> => {
  // 先获取用户所有的tmbId, 再根据tmbId获取空间列表(根据createTime排序)
  const tmb = await MongoTeamMember.findOne({ _id: tmbId }).lean();
  if (!tmb) {
    return Promise.reject(TeamErrEnum.notUser);
  }
  const resourceIds = (
    await MongoResourcePermission.find({
      tmbId,
      resourceType: PerResourceTypeEnum.space
    }).lean()
  ).filter((item) => {
    const per = new SpacePermission({ per: item.permission });
    // 筛选有读权限的空间
    if (!per.hasReadPer) return false;
    return true;
  });
  const spacePerMap = new Map<string, SpacePermission>(
    resourceIds.map((item) => [item.resourceId, new SpacePermission({ per: item.permission })])
  );
  const spaceList = await MongoSpace.find({
    $or: [
      // 在resourceIds中
      { _id: { $in: resourceIds.map((item) => item.resourceId) } },
      // 或者是空间的拥有者
      {
        ownerId: tmbId
      }
    ]
  })
    .populate<{ team: TeamSchema }>('team')
    .sort({ createTime: -1 })
    .lean();
  const res = spaceList.map((space) => {
    return {
      _id: space._id,
      name: space.name,
      teamId: space.teamId,
      avatar: space.avatar,
      createTime: space.createTime,
      type: space.type,
      ownerId: space.ownerId,
      description: space.description,
      team: space.team as TeamSchema,
      permission:
        (String(space.ownerId) === String(tmbId)
          ? new SpacePermission({ isOwner: true })
          : spacePerMap.get(space._id)) || new SpacePermission({ per: ReadPermissionVal })
    };
  });
  return res;
};

// 添加团队空间的成员及其角色(需要事务)
export const addSpaceMembers = async ({
  tmbs,
  roleId,
  spaceId,
  session
}: AddMembersPropsType & {
  session?: ClientSession;
}): Promise<void> => {
  // 调用前需要先鉴权,对该空间有管理权限
  const [role, tmbEntities, space] = await Promise.all([
    // 查询该角色类型的permission
    MongoRole.findOne({ _id: roleId, type: RoleTypeEnum.space }).lean(),
    MongoTeamMember.find({
      _id: {
        $in: tmbs
      }
    }).lean(),
    MongoSpace.findOne({
      _id: spaceId
    }).lean()
  ]);
  // TODO: 国际化添加
  if (!role) {
    return Promise.reject('指定的角色不存在');
  }
  if (!space) {
    return Promise.reject(SpaceErrEnum.unExist);
  }
  if (tmbs.includes(String(space.ownerId))) {
    return Promise.reject('不能添加空间所有者为成员');
  }
  // 检测权限表和角色表中是否已存在
  const [existingPermissions, existingRoleUsers] = await Promise.all([
    MongoResourcePermission.find({
      resourceId: spaceId,
      resourceType: PerResourceTypeEnum.space,
      tmbId: { $in: tmbs }
    }).lean(),
    MongoRoleUser.find({
      roleId,
      userId: { $in: tmbEntities.map((tmb) => tmb.userId) },
      type: RoleTypeEnum.space,
      spaceId
    }).lean()
  ]);
  if (existingPermissions.length > 0 || existingRoleUsers.length > 0) {
    return Promise.reject('有成员已存在于该空间中');
  }

  // 向权限表，角色表中添加

  await MongoResourcePermission.insertMany(
    tmbEntities.map((tmb) => ({
      resourceId: spaceId,
      resourceType: PerResourceTypeEnum.space,
      tmbId: tmb._id,
      teamId: tmb.teamId,
      permission: role.permission
    })),
    { session }
  ),
    await MongoRoleUser.insertMany(
      tmbEntities.map((tmb) => ({
        roleId: role._id,
        userId: tmb.userId,
        type: RoleTypeEnum.space,
        spaceId
      })),
      { session }
    );
};
// 移除团队空间的成员及其角色(需要事务)
export const removeSpaceMembers = async ({
  tmbs,
  spaceId,
  session
}: {
  tmbs: string[];
  spaceId: string;
  session?: ClientSession;
}): Promise<void> => {
  // 调用前需要先鉴权,对该空间有管理权限
  const [tmbEntities, space] = await Promise.all([
    MongoTeamMember.find({
      _id: { $in: tmbs }
    }).lean(),
    MongoSpace.findOne({
      _id: spaceId
    }).lean()
  ]);
  if (!space) {
    return Promise.reject(SpaceErrEnum.unExist);
  }
  // TODO: 国际化添加
  if (tmbs.includes(String(space.ownerId))) {
    return Promise.reject('不能移除空间所有者');
  }
  // 检测权限表和角色表中是否已存在
  const [existingPermissions, existingRoleUsers] = await Promise.all([
    MongoResourcePermission.find({
      resourceId: spaceId,
      resourceType: PerResourceTypeEnum.space,
      tmbId: { $in: tmbs }
    }).lean(),
    MongoRoleUser.find({
      userId: { $in: tmbEntities.map((tmb) => tmb.userId) },
      type: RoleTypeEnum.space,
      spaceId
    }).lean()
  ]);
  if (existingPermissions.length !== tmbs.length && existingRoleUsers.length !== tmbs.length) {
    return Promise.reject('有成员不在该空间中');
  }

  // 向权限表，角色表中删除

  await MongoResourcePermission.deleteMany(
    {
      _id: { $in: existingPermissions.map((item) => item._id) }
    },
    { session }
  ),
    await MongoRoleUser.deleteMany(
      {
        _id: { $in: existingRoleUsers.map((item) => item._id) }
      },
      { session }
    );
};
// 更新空间成员的角色(需要事务)
export const updateSpaceMemberRole = async ({
  tmbId,
  spaceId,
  roleId,
  session
}: {
  tmbId: string;
  spaceId: string;
  roleId: string;
  session?: ClientSession;
}) => {
  // 调用前需要先鉴权,对该空间有管理权限
  const [tmb, resourcePer, newRole, space] = await Promise.all([
    MongoTeamMember.findOne({ _id: tmbId }).lean(),
    MongoResourcePermission.findOne({
      tmbId,
      resourceType: PerResourceTypeEnum.space,
      resourceId: spaceId
    }).lean(),
    MongoRole.findOne({ _id: roleId, type: RoleTypeEnum.space }).lean(),
    MongoSpace.findOne({ _id: spaceId }).lean()
  ]);
  if (!tmb) {
    return Promise.reject(TeamErrEnum.notUser);
  }
  if (!space) {
    return Promise.reject(SpaceErrEnum.unExist);
  }
  if (tmb._id === space.ownerId) {
    return Promise.reject('不能修改空间所有者的角色');
  }
  if (!resourcePer) {
    return Promise.reject('成员不在该空间中');
  }
  if (!newRole) {
    return Promise.reject('指定的角色不存在');
  }
  await MongoResourcePermission.updateOne(
    { _id: resourcePer._id },
    { permission: newRole.permission },
    { session }
  );
  await MongoRoleUser.updateOne(
    { userId: tmb.userId, type: RoleTypeEnum.space, spaceId },
    { roleId: newRole._id },
    { session }
  );
};
