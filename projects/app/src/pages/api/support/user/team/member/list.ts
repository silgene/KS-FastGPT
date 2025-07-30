import { NextAPI } from '@/service/middleware/entry';
import type { PaginationProps, PaginationResponse } from '@fastgpt/global/common/fetch/type';
import { type TeamMemberListQuery } from '@fastgpt/global/support/user/team/controller';
import { type TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import {
  getTeamMemberCount,
  getTeamMemberList
} from '@fastgpt/service/support/user/team/controller';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

async function handler(
  req: ApiRequestProps<PaginationProps<TeamMemberListQuery>>,
  res: ApiResponseType<PaginationResponse<TeamMemberItemType>>
) {
  const { teamId: loginTeamId } = await authSystemAdmin({ req });
  const { teamId: queryTeamId } = req.body;
  const teamId = queryTeamId || loginTeamId;
  // TODO: 鉴权该角色是否对 此teamId 有查看成员权限
  const query = {
    ...req.body,
    teamId
  };
  const [list, count] = await Promise.all([getTeamMemberList(query), getTeamMemberCount(teamId)]);
  return {
    total: count,
    list: list
  };
}
export default NextAPI(handler);
