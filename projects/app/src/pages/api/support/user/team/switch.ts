import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { createUserSession, authUserSession } from '@fastgpt/service/support/user/session';
import { setCookie } from '@fastgpt/service/support/permission/controller';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

async function handler(req: ApiRequestProps, res: ApiResponseType) {
  // 验证用户身份
  const { userId } = await authCert({ req, authToken: true });

  const { teamId } = req.body as { teamId: string };

  if (!teamId) {
    return Promise.reject('teamId is required');
  }

  // 验证用户是否有权限切换到目标团队
  const teamMember = await MongoTeamMember.findOne({
    userId,
    teamId,
    status: TeamMemberStatusEnum.active
  }).lean();

  if (!teamMember) {
    return Promise.reject(TeamErrEnum.unAuthTeam);
  }

  // 创建新的用户会话，更新团队ID
  const token = await createUserSession({
    userId,
    teamId: String(teamId),
    tmbId: String(teamMember._id),
    ip: (req.headers['x-real-ip'] as string) || null
  });

  // 设置新的 cookie
  setCookie(res, token);

  return token;
}

export default NextAPI(handler);
