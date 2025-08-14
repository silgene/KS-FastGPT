import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { type AuthModeType, type AuthResponseType } from '../type';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { authTeam } from '../user/auth';
import { TeamManageMemberPermissionVal } from '@fastgpt/global/support/permission/user/constant';

/*
  Team manager can control org
*/
export const authOrgMember = async ({
  orgIds,
  ...props
}: {
  orgIds?: string | string[];
} & AuthModeType): Promise<AuthResponseType<TeamPermission>> => {
  const result = await authTeam({
    ...props,
    per: TeamManageMemberPermissionVal
  });
  const { teamId, tmbId, isRoot, tmb } = result;

  if (isRoot) {
    return {
      teamId,
      tmbId,
      userId: result.userId,
      appId: result.appId,
      apikey: result.apikey,
      isRoot,
      authType: result.authType,
      permission: new TeamPermission({ isOwner: true })
    };
  }

  if (tmb.permission.hasManageMemberPer) {
    return {
      ...result,
      permission: tmb.permission
    };
  }

  return Promise.reject('');
};
