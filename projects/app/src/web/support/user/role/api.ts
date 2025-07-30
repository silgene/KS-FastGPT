import { GET, POST, PUT } from '@/web/common/api/request';
import {
  type UpdateRoleType,
  type AddRoleModalFormType
} from '@fastgpt/global/support/user/role/controller';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';

// 获取角色列表
export const getRoleList = ({ type }: { type?: string } = {}) =>
  POST<RoleSchemaType[]>('/support/user/role/list', { type });

// 添加角色
export const addRole = (data: AddRoleModalFormType) => POST('/support/user/role/add', data);

// 更新角色
export const updateRole = (data: UpdateRoleType) =>
  PUT<RoleSchemaType>('/support/user/role/update', data);

// 删除角色
