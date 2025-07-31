import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getSpaceMemberList } from '@fastgpt/service/support/user/space/controller';
import type { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
import type { PaginationProps, PaginationResponse } from '@fastgpt/global/common/fetch/type';
import type { SpaceMemberItemType } from '@fastgpt/global/support/user/space/type';
import { authSpace } from '@fastgpt/service/support/permission/space/auth';
import { SpaceMemberReadPermissionVal } from '@fastgpt/global/support/permission/space/constant';

async function handler(
  req: ApiRequestProps<
    PaginationProps<{
      spaceId: string;
    }>
  >,
  res: ApiResponseType<PaginationResponse<SpaceMemberItemType>>
) {
  const { spaceId, ...paginationProps } = req.body;

  if (!spaceId) {
    throw new Error('spaceId is required');
  }

  // 身份验证
  const { tmbId } = await authSpace({
    spaceId,
    per: SpaceMemberReadPermissionVal,
    req,
    authToken: true
  });

  // 获取空间成员列表
  const memberList = await getSpaceMemberList({ spaceId, ...paginationProps });
  return memberList;
}

export default NextAPI(handler);
