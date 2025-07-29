import { GET, POST, PUT } from '@/web/common/api/request';
import type { SpaceDetailType } from '@fastgpt/global/support/user/space/type';
import type { TeamMemberItemType } from '@fastgpt/global/support/user/team/type.d';
import type { SpaceMemberItemType } from '@fastgpt/global/support/user/space/type';
import { type PaginationResponse, type PaginationProps } from '@fastgpt/global/common/fetch/type';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import type { TeamMemberListQuery } from '@fastgpt/global/support/user/team/controller.d';

export const getLastUsedSpace = () =>
  GET<SpaceDetailType>('/support/user/space/lastUsedSpace', {}, { maxQuantity: 1 });

export const getAllAccessibleSpaces = () => GET<SpaceDetailType[]>('/support/user/space/list');

// 获取空间成员列表
export const getSpaceMemberList = ({
  spaceId,
  ...paginationProps
}: PaginationProps<{ spaceId: string }>) =>
  POST<PaginationResponse<SpaceMemberItemType>>('/support/user/space/memberList', {
    spaceId,
    ...paginationProps
  });

// 获取可用团队成员列表
export const getAvailableTeamMembers = async (
  props: PaginationProps<TeamMemberListQuery> & { spaceId: string }
) => POST<PaginationResponse<TeamMemberItemType>>('/support/user/space/availableMemberList', props);
// 添加空间成员
export const addSpaceMembers = ({
  spaceId,
  tmbs,
  roleId
}: {
  spaceId: string;
  tmbs: string[];
  roleId: string;
}) =>
  POST('/support/user/space/addMember', {
    spaceId,
    tmbs,
    roleId
  });

// 移除空间成员
export const removeSpaceMembers = ({ spaceId, tmbs }: { spaceId: string; tmbs: string[] }) =>
  POST('/support/user/space/removeMember', {
    spaceId,
    tmbs
  });

// 更新空间成员角色
export const updateSpaceMemberRole = ({
  spaceId,
  tmbId,
  roleId
}: {
  spaceId: string;
  tmbId: string;
  roleId: string;
}) =>
  POST('/support/user/space/updateMemberRole', {
    spaceId,
    tmbId,
    roleId
  });
