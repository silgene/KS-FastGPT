import { NextAPI } from '@/service/middleware/entry';
import type { PaginationProps, PaginationResponse } from '@fastgpt/global/common/fetch/type';
import { type TeamMemberListQuery } from '@fastgpt/global/support/user/team/controller';
import { type TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import { getTeamMemberList } from '@fastgpt/service/support/user/team/controller';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

async function handler(
  req: ApiRequestProps<PaginationProps<TeamMemberListQuery>>,
  res: ApiResponseType<PaginationResponse<TeamMemberItemType>>
) {
  // TODO: 后续将SystemAdmin权限改为团队管理权限
  const { teamId } = await authSystemAdmin({ req });
  const query = {
    ...req.body,
    teamId
  };
  const list = await getTeamMemberList(query);
  return {
    total: list.length,
    list: list
  };
}
export default NextAPI(handler);
