import { NextAPI } from '@/service/middleware/entry';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import { getTeamMemberCount } from '@fastgpt/service/support/user/team/controller';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

async function handler(req: ApiRequestProps, res: ApiResponseType) {
  // TODO: 后续将SystemAdmin权限改为团队管理权限
  const { teamId } = await authSystemAdmin({ req });
  const count = await getTeamMemberCount(teamId);
  return {
    count: count
  };
}
export default NextAPI(handler);
