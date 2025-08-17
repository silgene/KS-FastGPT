import { SpaceMemberStatusEnum, SpaceTypeEnum } from '@fastgpt/global/support/user/space/constant';
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
  SpaceMemberSchemaType,
  SpaceSchemaType
} from '@fastgpt/global/support/user/space/type';
import { RoleCollectionName, RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import { getCustomRole } from '@fastgpt/global/support/user/role/controller';
import type { PaginationProps, PaginationResponse } from '@fastgpt/global/common/fetch/type';
import { getDefaultOwnerRole, getRoleByTmbId } from '../role/controller';
import { MongoRole } from '../role/roleSchema';
import { SpaceErrEnum } from '@fastgpt/global/common/error/code/space';
import type {
  AddMembersPropsType,
  AddUpdateSpacePropsType,
  GetSpaceMemberListPropsType
} from '@fastgpt/global/support/user/space/controller';
import { MongoSpaceMember } from './spaceMemberSchema';
import { SpaceDefaultPermissionVal } from '@fastgpt/global/support/permission/space/constant';
import { getRandomUserAvatar } from '@fastgpt/global/support/user/utils';
import { TeamMemberCollectionName } from '@fastgpt/global/support/user/team/constant';
import { userCollectionName } from '../schema';

// 获取空间中成员的列表
export const getSpaceMemberList = async ({
  spaceId,
  pageSize,
  offset,
  status,
  searchKey
}: PaginationProps<GetSpaceMemberListPropsType>): Promise<
  PaginationResponse<SpaceMemberItemType>
> => {
  const basePipeline: any[] = [
    { $match: { spaceId: new Types.ObjectId(spaceId), ...(status ? { status } : {}) } },
    {
      $lookup: {
        from: TeamMemberCollectionName,
        localField: 'tmbId',
        foreignField: '_id',
        as: 'tmb'
      }
    },
    { $unwind: '$tmb' },
    {
      $lookup: {
        from: userCollectionName,
        localField: 'tmb.userId',
        foreignField: '_id',
        as: 'tmbUser'
      }
    },
    { $unwind: { path: '$tmbUser', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: RoleCollectionName,
        localField: 'roleId',
        foreignField: '_id',
        as: 'role'
      }
    },
    { $unwind: { path: '$role', preserveNullAndEmptyArrays: true } }
  ];

  // 如果有搜索词，把对应的 $match 插入 basePipeline 的末尾
  if (searchKey && searchKey.trim()) {
    basePipeline.push({
      $match: {
        $or: [
          { 'tmb.name': { $regex: searchKey, $options: 'i' } },
          { 'tmbUser.username': { $regex: searchKey, $options: 'i' } }
        ]
      }
    });
  }

  // 用 $facet 同时返回分页数据和总数
  const page = Number(pageSize) || 10;
  const skip = Number(offset) || 0;
  const aggResult = await MongoSpaceMember.aggregate([
    {
      $facet: {
        data: [...basePipeline, { $skip: skip }, { $limit: page }],
        total: [...basePipeline, { $count: 'count' }]
      }
    }
  ]);
  const result = aggResult[0] || { data: [], total: [] };

  const spaceMember = result.data as (SpaceMemberSchemaType & {
    tmb: TeamMemberSchema;
  } & { role: RoleSchemaType } & { tmbUser?: { username: string } })[];
  const total = result.total[0]?.count || 0;

  console.log(RoleCollectionName);
  return {
    total,
    list: spaceMember.map((item) => {
      return {
        ...item.tmb,
        username: item.tmbUser?.username || item.tmb.name,
        role: item.role || getCustomRole(RoleTypeEnum.space, 0, '无角色'),
        status: item.status
      };
    })
  };
};

// 创建默认个人空间(每个个人空间都依托于单个团队)
export const createDefaultPersonalSpace = async ({
  tmbId,
  name = '个人空间',
  avatar = getRandomUserAvatar(),
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
  const ownerRole = await getDefaultOwnerRole(RoleTypeEnum.space);

  await MongoSpaceMember.create([
    {
      spaceId: insertedId,
      tmbId,
      roleId: ownerRole._id
    },
    { session }
  ]);
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
  const ownerRole = await getDefaultOwnerRole(RoleTypeEnum.space);
  await MongoSpaceMember.create(
    [
      {
        spaceId: space._id,
        tmbId,
        roleId: ownerRole._id
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
  // 这个tmb在哪些空间中是成员
  const tmbSpaceMember = await MongoSpaceMember.find({
    tmbId,
    status: SpaceMemberStatusEnum.active
  })
    .populate<{ tmb: TeamMemberSchema & { team: TeamSchema } }>({
      path: 'tmb',
      populate: {
        path: 'team'
      }
    })
    .populate<{ role: RoleSchemaType }>('role')
    .populate<{ space: SpaceSchemaType }>('space')
    .lean();
  return tmbSpaceMember.map((item) => {
    return {
      ...item.space,
      team: item.tmb.team,
      permission: new SpacePermission({
        isOwner: String(item.tmb._id) === String(item.spaceId),
        per: item.role.permission || SpaceDefaultPermissionVal
      })
    } as SpaceDetailType;
  });
};

// 添加团队空间的成员及其角色
export const addSpaceMembers = async ({
  tmbs,
  roleId,
  spaceId,
  session
}: AddMembersPropsType & {
  session?: ClientSession;
}): Promise<void> => {
  // 调用前需要先鉴权,对该空间有管理权限
  const [role, space] = await Promise.all([
    MongoRole.findOne({ _id: roleId, type: RoleTypeEnum.space }).lean(),
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
  const ops = tmbs.map((tmbId) => {
    return {
      updateOne: {
        filter: {
          tmbId,
          spaceId
        },
        update: {
          $set: {
            roleId: role._id,
            status: SpaceMemberStatusEnum.active
          },
          $setOnInsert: {
            createTime: new Date()
          }
        },
        upsert: true
      }
    };
  });
  await MongoSpaceMember.bulkWrite(ops, { session });
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
  if (tmbEntities.length !== tmbs.length) {
    return Promise.reject('部分团队成员不存在');
  }
  await MongoSpaceMember.updateMany(
    {
      tmbId: { $in: tmbs },
      spaceId
    },
    {
      $set: {
        status: SpaceMemberStatusEnum.leave
      }
    },
    { session }
  );
};
export const restoreSpaceMember = async ({
  tmbId,
  spaceId,
  session
}: {
  tmbId: string;
  spaceId: string;
  session?: ClientSession;
}) => {
  const leaveSpaceMember = await MongoSpaceMember.findOne({
    tmbId,
    spaceId,
    status: SpaceMemberStatusEnum.leave
  }).lean();
  if (!leaveSpaceMember) {
    return Promise.reject('成员不曾存在于该空间');
  }
  await MongoSpaceMember.updateOne(
    {
      _id: leaveSpaceMember._id
    },
    {
      $set: {
        status: SpaceMemberStatusEnum.active
      }
    },
    { session }
  );
};
// 更新空间成员的角色
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
  const [tmb, spaceMember, newRole, space] = await Promise.all([
    MongoTeamMember.findOne({ _id: tmbId }).lean(),
    MongoSpaceMember.findOne({ spaceId, tmbId }).lean(),
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
  if (!spaceMember) {
    return Promise.reject('成员不在该空间中');
  }
  if (!newRole) {
    return Promise.reject('指定的角色不存在');
  }
  await MongoSpaceMember.updateOne(
    {
      _id: spaceMember._id
    },
    {
      roleId: newRole._id
    },
    {
      session
    }
  );
};
