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
import type { SpaceDetailType } from '@fastgpt/global/support/user/space/type';

// 只有团队空间才可以有多个成员
export const getSpaceMemberList = async (spaceId: string) => {
  // TODO: 鉴权空间管理者
  const space = await MongoSpace.findOne({ _id: spaceId })
    .populate<{ tmb: TeamMemberSchema }>('tmb')
    .lean();
  if (!space) {
    return Promise.reject('空间不存在');
  }
  if (space.type === SpaceTypeEnum.personal) {
    return [space.tmb];
  }
  const tmbList = [
    // 空间创建者
    space.tmb,
    // 对这个空间有权限的团队成员
    ...(
      await MongoResourcePermission.find({
        resourceId: spaceId,
        resourceType: PerResourceTypeEnum.space
      })
        .populate<{ tmb: TeamMemberSchema }>('tmb')
        .lean()
    ).map((item) => {
      return item.tmb;
    })
  ];
  return tmbList;
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
export const createTeamSpace = async ({
  name,
  teamId,
  tmbId,
  avatar = '/icon/logo.svg',
  session
}: {
  name: string;
  teamId: string;
  tmbId: string;
  avatar?: string;
  session?: ClientSession;
}) => {
  const [{ _id: insertedId }] = await MongoSpace.create(
    [
      {
        name,
        avatar,
        teamId: teamId,
        type: SpaceTypeEnum.team,
        createTime: new Date(),
        ownerId: tmbId
      }
    ],
    { session }
  );
  return insertedId;
};

export const getSpaceList = async (userId: string): Promise<SpaceDetailType[]> => {
  // 先获取用户所有的tmbId, 再根据tmbId获取空间列表(根据 teamId和createTime 排序)
  const tmbList = await MongoTeamMember.find({ userId }).lean();
  if (!tmbList || tmbList.length === 0) {
    return Promise.reject(TeamErrEnum.notUser);
  }
  const resourceIds = (
    await MongoResourcePermission.find({
      tmbId: { $in: tmbList.map((item) => item._id) },
      resourceType: PerResourceTypeEnum.space
    }).lean()
  ).filter((item) => {
    const per = new SpacePermission({ per: item.permission });
    // 筛选有读权限的空间
    if (!per.hasReadPer) return false;
    return true;
  });
  const spaceList = await MongoSpace.find({
    $or: [
      // 在resourceIds中
      { _id: { $in: resourceIds.map((item) => item.resourceId) } },
      // 或者是空间的拥有者
      {
        ownerId: { $in: tmbList.map((item) => new Types.ObjectId(item._id)) }
      }
    ]
  })
    .populate<{ team: TeamSchema }>('team')
    .sort({ teamId: -1, createTime: -1 })
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
      // TODO: 需要根据tmbId获取具体的权限
      permission: new SpacePermission({ per: ReadPermissionVal })
    };
  });
  return res;
};
