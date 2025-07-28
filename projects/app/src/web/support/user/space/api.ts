import { GET, POST, PUT } from '@/web/common/api/request';
import type { SpaceDetailType } from '@fastgpt/global/support/user/space/type';
import type { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
import type { SpaceMemberItemType } from '@fastgpt/global/support/user/space/type';
import { type PaginationResponse, type PaginationProps } from '@fastgpt/global/common/fetch/type';

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
