import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import type { AuthModeType, AuthResponseType } from '../type';
import { parseHeaderCert } from '../controller';
import { getRoleByTmbId } from '../../../support/user/role/controller';
import { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import { SystemPermission } from '@fastgpt/global/support/permission/system/controller';
export const authSystemByTmbId = async ({
  tmbId,
  per
}: {
  tmbId: string;
  per: PermissionValueType;
}) => {
  const role = await getRoleByTmbId({
    type: RoleTypeEnum.system,
    tmbId
  });
  const permission = new SystemPermission({ per: role.permission });
  if (!permission.checkPer(per)) {
    return Promise.reject(new Error('没有该系统权限'));
  }
  return {
    permission
  };
};

export const authSystem = async ({
  per,
  ...props
}: AuthModeType & {
  per: PermissionValueType;
}): Promise<AuthResponseType<SystemPermission>> => {
  const result = await parseHeaderCert(props);
  const { tmbId } = result;
  const { permission } = await authSystemByTmbId({
    tmbId,
    per
  });
  return {
    ...result,
    permission
  };
};
