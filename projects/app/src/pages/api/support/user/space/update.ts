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
import {
  addSpaceMembers,
  addTeamSpace,
  updateTeamSpaceInfo
} from '@fastgpt/service/support/user/space/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import type { AddUpdateSpacePropsType } from '@fastgpt/global/support/user/space/controller';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';

async function handler(
  req: ApiRequestProps<AddUpdateSpacePropsType>,
  res: ApiResponseType<SpaceSchemaType>
) {
  const { _id: spaceId } = req.body;
  if (!spaceId) {
    return Promise.reject('需要传入空间ID');
  }
  // 需要是该空间的所有者
  await authSpace({ req, authToken: true, spaceId, per: OwnerPermissionVal });
  const space = await mongoSessionRun(async (session) => {
    return updateTeamSpaceInfo({
      ...req.body,
      session
    });
  });
  return space;
}

export default NextAPI(handler);
