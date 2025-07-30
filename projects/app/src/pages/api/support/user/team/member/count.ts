import { NextAPI } from '@/service/middleware/entry';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import { getTeamMemberCount } from '@fastgpt/service/support/user/team/controller';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

async function handler(req: ApiRequestProps<void, { teamId?: string }>, res: ApiResponseType) {
  const { teamId: loginTeamId } = await authSystemAdmin({ req });
  const { teamId: queryTeamId } = req.query;
  const teamId = queryTeamId || loginTeamId;
  //TODO: 鉴权该角色是否对 teamId 有查看成员权限
  const count = await getTeamMemberCount(teamId);
  return {
    count: count
  };
}
export default NextAPI(handler);
