import type { MemberGroupSchemaType } from 'support/permission/memberGroup/type';
import { MemberGroupListItemType } from 'support/permission/memberGroup/type';
import type { OAuthEnum } from './constant';
import type { TrackRegisterParams } from './login/api';
import { TeamMemberStatusEnum } from './team/constant';
import type { OrgType } from './team/org/type';
import type { TeamMemberItemType } from './team/type';
import type { PaginationProps, PaginationResponse } from '../../common/fetch/type';
import type { UserModelSchema } from './type';
import type { RoleSchemaType } from './role/type';

export type PostLoginProps = {
  username: string;
  password: string;
  code: string;
};

export type OauthLoginProps = {
  type: `${OAuthEnum}`;
  callbackUrl: string;
  props: Record<string, string>;
} & TrackRegisterParams;

export type WxLoginProps = {
  inviterId?: string;
  code: string;
};

export type FastLoginProps = {
  token: string;
  code: string;
};

export type SearchResult = {
  members: Omit<TeamMemberItemType, 'teamId' | 'permission'>[];
  orgs: Omit<OrgType, 'permission' | 'members'>[];
  groups: MemberGroupSchemaType[];
};
export type GetUserListQuery = PaginationProps<{ searchKey: string }>;
export type GetUserListResponse = PaginationResponse<UserModelSchema & { role: RoleSchemaType }>;
export type AvailableUserListQuery = PaginationProps<{
  searchKey?: string;
  teamId: string;
}>;
