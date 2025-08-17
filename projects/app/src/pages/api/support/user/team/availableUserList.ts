import { NextAPI } from '@/service/middleware/entry';
import type {
  AvailableUserListQuery,
  GetUserListQuery,
  GetUserListResponse,
  SearchResult
} from '@fastgpt/global/support/user/api';
import type { UserModelSchema } from '@fastgpt/global/support/user/type';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { getTeamMemberCount } from '@fastgpt/service/support/user/team/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { authSystem } from '@fastgpt/service/support/permission/system/auth';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import { getCustomRole } from '@fastgpt/global/support/user/role/controller';
import { NullPermission } from '@fastgpt/global/support/permission/constant';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import type { PaginationProps, PaginationResponse } from '@fastgpt/global/common/fetch/type';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { SpaceMemberStatusEnum } from '@fastgpt/global/support/user/space/constant';
// 获取不在某个团队中的用户列表
async function handler(
  req: ApiRequestProps<AvailableUserListQuery>,
  res: ApiResponseType<GetUserListResponse>
): Promise<GetUserListResponse> {
  // TODO: 鉴权查看用户列表
  await authCert({ req, authToken: true });
  const { searchKey = '', pageSize, offset = 0, teamId } = req.body;
  const existingMembers = await MongoTeamMember.find({
    teamId: teamId,
    status: SpaceMemberStatusEnum.active
  })
    .distinct('userId')
    .lean();
  const match: Record<string, any> = {
    _id: { $nin: existingMembers }
  };
  if (searchKey.trim().length) {
    match.username = {
      $regex: searchKey,
      $options: 'i'
    };
  }

  const users = await MongoUser.find(match)
    .limit(pageSize as number)
    .skip(offset as number)
    .populate<{ role: RoleSchemaType }>('role')
    .lean();

  return {
    total: await MongoUser.countDocuments(match),
    list: users
  };
}
export default NextAPI(handler);
