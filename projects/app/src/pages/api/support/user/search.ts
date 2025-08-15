import { NextAPI } from '@/service/middleware/entry';
import type { SearchResult } from '@fastgpt/global/support/user/api';
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

async function handler(
  req: ApiRequestProps<{ searchKey: string; members?: boolean }>,
  res: ApiResponseType
) {
  const { teamId } = await authCert({ req, authToken: true });
  const { searchKey = '', members = true } = req.body;
  const match: Record<string, any> = {};
  if (searchKey.trim().length) {
    match.username = {
      $regex: searchKey,
      $options: 'i'
    };
  }
  const searchResult: SearchResult = {
    members: [],
    orgs: [],
    groups: []
  };
  if (members) {
    const tmbs = await MongoTeamMember.find({
      teamId
    })
      .populate<{ user: UserModelSchema }>({
        path: 'user',
        match: match
      })
      .lean();
    const roleUsers = await MongoRoleUser.find({
      type: RoleTypeEnum.system,
      userId: { $in: tmbs.map((item) => item.userId) }
    })
      .populate<{ role: RoleSchemaType }>('role')
      .lean();
    const roleUserMap = new Map(roleUsers.map((item) => [item.userId, item]));
    searchResult.members = tmbs.map((item) => {
      return {
        userId: item.userId,
        tmbId: item._id,
        teamId: item.teamId,
        memberName: item.user.username,
        username: item.user.username,
        avatar: item.avatar,
        role:
          roleUserMap.get(item.userId)?.role ||
          getCustomRole(RoleTypeEnum.system, NullPermission, '无角色'),
        status: item.status,
        contact: item.user.contact,
        createTime: item.createTime,
        updateTime: item.updateTime
      };
    });
  }

  return searchResult;
}
export default NextAPI(handler);
