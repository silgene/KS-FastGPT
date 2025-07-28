import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoSpace } from '@fastgpt/service/support/user/space/spaceSchema';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { SpaceTypeEnum } from '@fastgpt/global/support/user/space/constant';
import { SpaceErrEnum } from '@fastgpt/global/common/error/code/space';
import type { SpaceDetailType } from '@fastgpt/global/support/user/space/type';
import { getSpaceList } from '@fastgpt/service/support/user/space/controller';

async function handler(req: ApiRequestProps, res: ApiResponseType<SpaceDetailType[]>) {
  const { userId, tmbId } = await authCert({ req, authToken: true });
  // 获取用户所有可访问的空间
  const spaceList = await getSpaceList(tmbId);
  return spaceList;
}

export default NextAPI(handler);
