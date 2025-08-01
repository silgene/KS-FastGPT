import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoSpace } from '@fastgpt/service/support/user/space/spaceSchema';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { SpaceTypeEnum } from '@fastgpt/global/support/user/space/constant';
import { SpaceErrEnum } from '@fastgpt/global/common/error/code/space';
import type { SpaceDetailType } from '@fastgpt/global/support/user/space/type';
import type { TeamSchema } from '@fastgpt/global/support/user/team/type';
import { getSpaceList } from '@fastgpt/service/support/user/space/controller';

async function handler(req: ApiRequestProps, res: ApiResponseType<SpaceDetailType>) {
  const { tmbId, teamId } = await authCert({ req, authToken: true });
  // TODO: 获取用户最后使用的空间(需要在user表中记录)
  // const space = await MongoSpace.findOne({ ownerId: tmbId, teamId, type: SpaceTypeEnum.personal })
  //   .populate<{ team: TeamSchema }>('team')
  //   .lean();
  const spaceList = await getSpaceList(tmbId);

  if (!spaceList || spaceList.length === 0) {
    return Promise.reject(SpaceErrEnum.unExist);
  }
  return spaceList[0];
}

export default NextAPI(handler);
