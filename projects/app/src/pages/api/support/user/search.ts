import { NextAPI } from '@/service/middleware/entry';
import type { SearchResult } from '@fastgpt/global/support/user/api';
import type { UserModelSchema } from '@fastgpt/global/support/user/type';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import { getTeamMemberCount } from '@fastgpt/service/support/user/team/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

async function handler(
  req: ApiRequestProps<{ searchKey: string; members?: boolean; orgs?: boolean; groups?: boolean }>,
  res: ApiResponseType
) {
  // TODO: 后续将SystemAdmin权限改为团队管理员权限
  const { teamId } = await authSystemAdmin({ req });
  const { searchKey = '', members = true, orgs = true, groups = true } = req.body;
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
    searchResult.members = tmbs.map((item) => {
      return {
        userId: item.userId,
        tmbId: item._id,
        teamId: item.teamId,
        memberName: item.user.username,
        avatar: item.avatar,
        role: item.role,
        status: item.status,
        contact: item.user.contact,
        createTime: item.createTime,
        updateTime: item.updateTime
      };
    });
  }
  if (orgs) {
  }
  if (groups) {
  }
  return searchResult;
}
export default NextAPI(handler);
