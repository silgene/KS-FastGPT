import { NextAPI } from '@/service/middleware/entry';
import { TeamInviteTeamMemberPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { type InviteUserToTeamProps } from '@fastgpt/global/support/user/team/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { authSystemAdmin, authTeam } from '@fastgpt/service/support/permission/user/auth';
import {
  getTeamMemberCount,
  inviteUserToTeam
} from '@fastgpt/service/support/user/team/controller';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

async function handler(req: ApiRequestProps<InviteUserToTeamProps>, res: ApiResponseType) {
  await authTeam({ req, authToken: true, per: TeamInviteTeamMemberPermissionVal });
  mongoSessionRun(async (session) => {
    return inviteUserToTeam({ ...req.body, session });
  });
}
export default NextAPI(handler);
