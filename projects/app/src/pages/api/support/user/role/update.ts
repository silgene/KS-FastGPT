import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { updateRoleType } from '@fastgpt/service/support/user/role/controller';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { type UpdateRoleType } from '@fastgpt/global/support/user/role/controller';

async function handler(req: ApiRequestProps<UpdateRoleType>, res: ApiResponseType<RoleSchemaType>) {
  await authCert({ req, authToken: true });
  const body = req.body;

  const updatedRole = await updateRoleType({
    ...body
  });

  return updatedRole;
}

export default NextAPI(handler);
