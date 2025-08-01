import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoSpace } from '@fastgpt/service/support/user/space/spaceSchema';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { SpaceTypeEnum } from '@fastgpt/global/support/user/space/constant';
import { SpaceErrEnum } from '@fastgpt/global/common/error/code/space';
import type { SpaceDetailType, SpaceSchemaType } from '@fastgpt/global/support/user/space/type';
import type { TeamSchema } from '@fastgpt/global/support/user/team/type';
import { authSpace } from '@fastgpt/service/support/permission/space/auth';
import { SpaceMemberManagePermissionVal } from '@fastgpt/global/support/permission/space/constant';
import { addSpaceMembers, addTeamSpace } from '@fastgpt/service/support/user/space/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import type { AddUpdateSpacePropsType } from '@fastgpt/global/support/user/space/controller';

async function handler(
  req: ApiRequestProps<AddUpdateSpacePropsType>,
  res: ApiResponseType<SpaceSchemaType>
) {
  const { tmbId, teamId } = await authCert({ req, authToken: true });
  // TODO: authTeam 是否有在Team下创建空间的权限
  const space = await mongoSessionRun(async (session) => {
    return addTeamSpace({
      ...req.body,
      tmbId,
      teamId,
      session
    });
  });
  return space;
}

export default NextAPI(handler);
