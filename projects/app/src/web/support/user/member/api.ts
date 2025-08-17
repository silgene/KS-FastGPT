import { POST, PUT } from '@/web/common/api/request';
import type { GetUserListQuery, GetUserListResponse } from '@fastgpt/global/support/user/api';
import type { UpdateMemberRoleRequestType } from '@fastgpt/global/support/user/role/controller';

// 获取系统用户列表
export const getSystemUserList = (data: GetUserListQuery) =>
  POST<GetUserListResponse>('/support/user/list', data, { maxQuantity: 1 });

// 更新成员角色
export const updateMemberRole = (data: UpdateMemberRoleRequestType) =>
  PUT('/support/user/role/updateMemberRole', data);
