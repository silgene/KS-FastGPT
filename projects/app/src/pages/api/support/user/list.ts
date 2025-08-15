import { NextAPI } from '@/service/middleware/entry';
import type {
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
import { MongoRoleUser } from '@fastgpt/service/support/user/role/roleUser/roleUserSchema';
import { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import { getCustomRole } from '@fastgpt/global/support/user/role/controller';
import { NullPermission } from '@fastgpt/global/support/permission/constant';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import type { PaginationProps, PaginationResponse } from '@fastgpt/global/common/fetch/type';
import { MongoUser } from '@fastgpt/service/support/user/schema';

async function handler(
  req: ApiRequestProps<GetUserListQuery>,
  res: ApiResponseType<GetUserListResponse>
) {
  // TODO: 鉴权查看用户列表
  await authCert({ req, authToken: true });
  const { searchKey = '', pageSize, offset = 0 } = req.body;
  const match: Record<string, any> = {};
  if (searchKey.trim().length) {
    match.username = {
      $regex: searchKey,
      $options: 'i'
    };
  }

  const users = await MongoUser.find(match)
    .limit(pageSize as number)
    .skip(offset as number)
    .lean();
  const roleUsers = await MongoRoleUser.find({
    type: RoleTypeEnum.system,
    userId: { $in: users.map((item) => item._id) }
  })
    .populate<{ role: RoleSchemaType }>('role')
    .lean();
  const roleUserMap = new Map(roleUsers.map((item) => [String(item.userId), item]));
  const members = users.map((item) => {
    return {
      _id: item._id,
      username: item.username,
      role:
        roleUserMap.get(String(item._id))?.role ||
        getCustomRole(RoleTypeEnum.system, NullPermission, '无角色'),
      status: item.status,
      createTime: item.createTime
    };
  });

  return {
    total: await MongoUser.countDocuments(match),
    list: members
  };
}
export default NextAPI(handler);
