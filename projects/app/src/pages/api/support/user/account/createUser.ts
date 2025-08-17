import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { authSystem } from '@fastgpt/service/support/permission/system/auth';
import { SystemUserCreatePermissionVal } from '@fastgpt/global/support/permission/system/constant';
import { createSystemUser } from '@fastgpt/service/support/user/controller';
import { MongoUser } from '@fastgpt/service/support/user/schema';
export type createUserPrpos = {
  username: string;
  password: string;
  roleId: string;
};

export type CreateUserResponse = {
  created: Array<{ username: string; userId: string }>;
  failed: Array<{ username: string; error: string }>;
  alreadyExists: Array<{ username: string; userId: string }>;
};

async function handler(
  req: ApiRequestProps<createUserPrpos>,
  res: ApiResponseType<CreateUserResponse>
) {
  const created: Array<{ username: string; userId: string }> = [];
  const failed: Array<{ username: string; error: string }> = [];
  const alreadyExists: Array<{ username: string; userId: string }> = [];
  const { username, password, roleId } = req.body;
  await authSystem({ req, per: SystemUserCreatePermissionVal, authToken: true });
  const existingUser = await MongoUser.findOne({ username }, '_id').lean();
  if (existingUser) {
    alreadyExists.push({ username, userId: existingUser._id });
  }

  const user = await createSystemUser({
    username,
    password,
    roleId
  });

  created.push({ username, userId: String(user._id) });
  return {
    created,
    failed,
    alreadyExists
  };
}

export default NextAPI(handler);
