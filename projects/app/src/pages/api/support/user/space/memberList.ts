import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getSpaceMemberList } from '@fastgpt/service/support/user/space/controller';
import type { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';

type Query = {
  spaceId: string;
};

async function handler(req: ApiRequestProps<any, Query>, res: ApiResponseType<TeamMemberSchema[]>) {
  const { spaceId } = req.query;

  if (!spaceId) {
    throw new Error('spaceId is required');
  }

  // 身份验证
  const { tmbId } = await authCert({ req, authToken: true });

  // 获取空间成员列表
  const memberList = await getSpaceMemberList(spaceId);

  return memberList;
}

export default NextAPI(handler);
