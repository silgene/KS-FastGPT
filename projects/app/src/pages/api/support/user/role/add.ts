import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { addRoleType } from '@fastgpt/service/support/user/role/controller';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import type { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';

async function handler(
  req: ApiRequestProps<{
    type: RoleTypeEnum;
    name: string;
    description: string;
  }>,
  res: ApiResponseType<RoleSchemaType>
) {
  const { type, name, description } = req.body;
  const role = await addRoleType({
    type,
    name,
    description
  });
  return role;
}

export default NextAPI(handler);
