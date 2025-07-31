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
import { addSpaceMembers } from '@fastgpt/service/support/user/space/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import type { AddMembersPropsType } from '@fastgpt/global/support/user/space/controller';

async function handler(req: ApiRequestProps<AddMembersPropsType>, res: ApiResponseType) {
  const { spaceId, tmbs, roleId } = req.body;
  await authSpace({ spaceId, req, authToken: true, per: SpaceMemberManagePermissionVal });
  await mongoSessionRun(async (session) => {
    await addSpaceMembers({
      spaceId,
      tmbs,
      roleId,
      session
    });
  });
}

export default NextAPI(handler);
