import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import { getTeamMemberCount } from '@fastgpt/service/support/user/team/controller';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

async function handler(req: ApiRequestProps<void, { teamId?: string }>, res: ApiResponseType) {
  //TODO: 鉴权该角色是否对 teamId 有查看成员权限
  const { teamId: loginTeamId } = await authCert({ req, authToken: true });
  const { teamId: queryTeamId } = req.query;
  const teamId = queryTeamId || loginTeamId;
  const count = await getTeamMemberCount(teamId);
  return {
    count: count
  };
}
export default NextAPI(handler);
