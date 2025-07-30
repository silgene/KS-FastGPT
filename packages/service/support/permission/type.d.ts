import type { Permission, PermissionBase } from '@fastgpt/global/support/permission/controller';
import type { ApiRequestProps } from '../../type/next';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import type { RequireAtLeastOne } from '@fastgpt/global/common/type/utils';
import type {
  AuthUserTypeEnum,
  PermissionKeyEnum
} from '@fastgpt/global/support/permission/constant';
import { type SpacePermission } from '@fastgpt/global/support/permission/space/controller';

export type ReqHeaderAuthType = {
  cookie?: string;
  token?: string;
  apikey?: string; // abandon
  rootkey?: string;
  userid?: string;
  authorization?: string;
};

type authModeType = {
  req: ApiRequestProps;
  authToken?: boolean;
  authRoot?: boolean;
  authApiKey?: boolean;
  per?: PermissionValueType;
};

export type AuthModeType = RequireAtLeastOne<authModeType, 'authApiKey' | 'authRoot' | 'authToken'>;

export type AuthResponseType<T = Permission> = {
  userId: string;
  teamId: string;
  tmbId: string;
  authType?: `${AuthUserTypeEnum}`;
  appId?: string;
  apikey?: string;
  isRoot: boolean;
  permission: T extends PermissionBase<infer U> ? PermissionBase<U> : T;
};
