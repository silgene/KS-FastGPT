import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getRoleList } from '@fastgpt/service/support/user/role/controller';
import type { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import { RoleStatusEnum } from '@fastgpt/global/support/user/role/constant';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';

async function handler(
  req: ApiRequestProps<{
    type?: RoleTypeEnum;
  }>,
  res: ApiResponseType<RoleSchemaType[]>
) {
  await authCert({ req, authToken: true });
  const { type } = req.body;

  const roles = await getRoleList({
    type,
    status: RoleStatusEnum.active
  });

  return roles;
}

export default NextAPI(handler);
