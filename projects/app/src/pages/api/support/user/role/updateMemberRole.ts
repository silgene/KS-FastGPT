import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoSpace } from '@fastgpt/service/support/user/space/spaceSchema';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { SpaceTypeEnum } from '@fastgpt/global/support/user/space/constant';
import { SpaceErrEnum } from '@fastgpt/global/common/error/code/space';
import type { SpaceDetailType } from '@fastgpt/global/support/user/space/type';
import type { TeamSchema } from '@fastgpt/global/support/user/team/type';
import { authSpace } from '@fastgpt/service/support/permission/space/auth';
import { SpaceMemberManagePermissionVal } from '@fastgpt/global/support/permission/space/constant';
import {
  addSpaceMembers,
  updateSpaceMemberRole
} from '@fastgpt/service/support/user/space/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { updateMemberRole } from '@fastgpt/service/support/user/role/controller';
import { type UpdateMemberRoleRequestType } from '@fastgpt/global/support/user/role/controller';
import { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { authTeam } from '@fastgpt/service/support/permission/user/auth';
import { TeamManageMemberPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { authSystem } from '@fastgpt/service/support/permission/system/auth';
import { SystemUserManagePermissionVal } from '@fastgpt/global/support/permission/system/constant';

async function handler(req: ApiRequestProps<UpdateMemberRoleRequestType>, res: ApiResponseType) {
  const { type, tmbId, teamId, spaceId, roleId } = req.body;
  if (type === RoleTypeEnum.space) {
    if (!spaceId) return Promise.reject(SpaceErrEnum.unAuthSpace);
    await authSpace({ spaceId, req, authToken: true, per: SpaceMemberManagePermissionVal });
  }
  if (type === RoleTypeEnum.team) {
    if (!teamId) return Promise.reject(TeamErrEnum.unAuthTeam);
    await authTeam({ teamId, req, authToken: true, per: TeamManageMemberPermissionVal });
  }
  if (type === RoleTypeEnum.system) {
    await authSystem({ req, authToken: true, per: SystemUserManagePermissionVal });
  }
  await updateMemberRole(req.body);
}

export default NextAPI(handler);
