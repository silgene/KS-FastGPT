import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { updateRoleType } from '@fastgpt/service/support/user/role/controller';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

async function handler(
  req: ApiRequestProps<{
    roleId: string;
    Permission: PermissionValueType;
  }>,
  res: ApiResponseType<RoleSchemaType>
) {
  await authCert({ req, authToken: true });
  const { roleId, Permission } = req.body;

  const updatedRole = await updateRoleType({
    roleId,
    Permission
  });

  return updatedRole;
}

export default NextAPI(handler);
