import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createContext } from 'use-context-selector';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getTeamMemberCount } from '@/web/support/user/team/api';
import { useUserStore } from '@/web/support/user/useUserStore';
import type { RoleDetailType, RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import { getRoleList } from '@/web/support/user/role/api';
import { type RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';

type RoleListMapType = Partial<Record<`${RoleTypeEnum}`, RoleSchemaType[]>>;
type RoleManageContextType = {
  roleList: RoleSchemaType[];
  loading?: boolean;
  selectingRole?: RoleSchemaType;
  changeSelectingRole: (role: RoleSchemaType) => void;
  editSelectingRole: (role: RoleSchemaType) => void;
  selectingRoleEdit: boolean;
  roleListMap: RoleListMapType;
};

export const RoleManageContext = createContext<RoleManageContextType>({
  roleList: [],
  loading: false,
  selectingRole: undefined,
  changeSelectingRole: () => {
    throw new Error('function is not implemented');
  },
  editSelectingRole: () => {
    throw new Error('function is not implemented');
  },
  selectingRoleEdit: false,
  roleListMap: {}
});
const RoleManageContextProvider = ({ children }: { children: ReactNode }) => {
  // 这里可以添加状态管理逻辑
  const { userInfo } = useUserStore();
  const [selectingRole, setSelectingRole] = useState<RoleSchemaType>();
  const {
    data: roleList,
    refresh: refreshRoleList,
    loading
  } = useRequest2(getRoleList, {
    manual: false,
    refreshDeps: [],
    onSuccess: (data) => {
      if (data.length > 0) {
        // 默认选择第一个角色
        setSelectingRole(data[0]);
      }
    }
  });

  const [selectingRoleEdit, setSelectingRoleEdit] = useState(false);
  const editSelectingRole = (role: RoleSchemaType) => {
    setSelectingRoleEdit(true);
    setSelectingRole(role);
  };
  const changeSelectingRole = (role: RoleSchemaType) => {
    setSelectingRole(role);
    setSelectingRoleEdit(false);
  };

  const roleListMap = useMemo<RoleListMapType>(() => {
    if (!roleList) return {};
    const map: RoleListMapType = {};
    for (const role of roleList) {
      if (!map[role.type]) {
        map[role.type] = [];
      }
      map[role.type]?.push(role);
    }
    return map;
  }, [roleList]);

  const contextValue: RoleManageContextType = {
    // 实现具体的状态和方法
    roleList: roleList || [],
    loading,
    selectingRole,
    changeSelectingRole,
    roleListMap,
    editSelectingRole,
    selectingRoleEdit
  };

  return <RoleManageContext.Provider value={contextValue}>{children}</RoleManageContext.Provider>;
};

export default RoleManageContextProvider;
