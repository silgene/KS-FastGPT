import { NextAPI } from '@/service/middleware/entry';
import type { PaginationProps, PaginationResponse } from '@fastgpt/global/common/fetch/type';
import { type TeamMemberListQuery } from '@fastgpt/global/support/user/team/controller';
import { type TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';
import { type UserModelSchema } from '@fastgpt/global/support/user/type';
import { MongoSpace } from '@fastgpt/service/support/user/space/spaceSchema';
import { SpaceErrEnum } from '@fastgpt/global/common/error/code/space';
import { authSpace } from '@fastgpt/service/support/permission/space/auth';
import { SpaceMemberReadPermissionVal } from '@fastgpt/global/support/permission/space/constant';

type availableMember = {
  userId: string;
  tmbId: string;
  teamId: string;
  memberName: string;
  avatar: string;
  role: string;
};

async function handler(
  req: ApiRequestProps<PaginationProps<TeamMemberListQuery> & { spaceId: string }>,
  res: ApiResponseType<PaginationResponse<availableMember[]>>
) {
  const { teamId } = await authSpace({
    req,
    spaceId: req.body.spaceId,
    authToken: true,
    per: SpaceMemberReadPermissionVal
  });
  const { offset, pageSize } = parsePaginationRequest(req);
  const { searchKey, spaceId } = req.body; // 获取搜索关键字

  const space = await MongoSpace.findOne({ _id: spaceId }).lean();
  if (!space) {
    return Promise.reject(SpaceErrEnum.unExist);
  }
  // 获取已在空间中的成员 ID
  const existingMembers = await MongoResourcePermission.find({
    resourceType: PerResourceTypeEnum.space,
    resourceId: spaceId
  })
    .distinct('tmbId')
    .lean();
  existingMembers.push(space.ownerId);
  // 构建查询条件
  const query = {
    teamId,
    _id: { $nin: existingMembers }
  };

  // 构建用户匹配条件（用于 populate 的 match 参数）
  const userMatch: Record<string, any> = {};
  if (searchKey?.trim().length) {
    userMatch.username = { $regex: searchKey, $options: 'i' };
  }
  // 并行执行查询和计数
  const [availableMembers, total] = await Promise.all([
    MongoTeamMember.find(query)
      .populate<{ user: UserModelSchema }>({
        path: 'user',
        select: 'username avatar contact',
        match: userMatch // 添加用户名搜索条件
      })
      .skip(offset)
      .limit(pageSize)
      .lean(),
    MongoTeamMember.countDocuments(query)
  ]);

  // 使用 map 转换数据结构
  const Members = availableMembers
    .filter((item) => item.user) // 过滤掉没有匹配搜索条件的用户
    .map((item) => ({
      userId: String(item.userId),
      tmbId: String(item._id),
      teamId: String(item.teamId),
      memberName: item.user?.username,
      avatar: item.avatar,
      role: item.role
    }));

  return {
    list: Members,
    total: total
  };
}

export default NextAPI(handler);
