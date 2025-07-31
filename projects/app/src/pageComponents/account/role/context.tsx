import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createContext } from 'use-context-selector';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getTeamMemberCount } from '@/web/support/user/team/api';
import { useUserStore } from '@/web/support/user/useUserStore';
import type { RoleDetailType, RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import { getRoleList } from '@/web/support/user/role/api';
import { type RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import { updateRole } from '@/web/support/user/role/api';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { type UpdateRoleType } from '@fastgpt/global/support/user/role/controller';

type RoleListMapType = Partial<Record<`${RoleTypeEnum}`, RoleSchemaType[]>>;
type RoleManageContextType = {
  roleList: RoleSchemaType[];
  loading?: boolean;
  selectingRole?: RoleSchemaType;
  changeSelectingRole: (role: RoleSchemaType) => void;
  editSelectingRole: (role: RoleSchemaType) => void;
  selectingRoleEdit: boolean;
  roleListMap: RoleListMapType;
  saveRolePermission: () => Promise<void>;
  refreshRoleList: () => void;
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
  roleListMap: {},
  saveRolePermission: async () => {
    throw new Error('function is not implemented');
  },
  refreshRoleList: () => {
    throw new Error('function is not implemented');
  }
});
const RoleManageContextProvider = ({ children }: { children: ReactNode }) => {
  // 这里可以添加状态管理逻辑
  const { userInfo } = useUserStore();
  const { toast } = useToast();
  const [selectingRole, setSelectingRole] = useState<RoleSchemaType>();
  const {
    data: roleList,
    refresh: refreshRoleList,
    loading: getRoleListLoading
  } = useRequest2(getRoleList, {
    manual: false,
    refreshDeps: [],
    onSuccess: (data) => {
      if (data.length === 0) return;
      if (selectingRole) {
        const role = data.find((item) => item._id === selectingRole?._id);
        if (role) {
          setSelectingRoleEdit(false);
          setSelectingRole(role);
          return;
        }
      }
      setSelectingRole(data[0]); // 如果当前选择的角色不存在，则选择第一个角色
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

  const { run: updateRoleRun, loading: updateRoleLoading } = useRequest2(
    async (data: UpdateRoleType) => {
      await updateRole(data);
    },
    {
      onSuccess: (res) => {
        toast({
          title: '更新成功',
          status: 'success'
        });
        refreshRoleList();
        setSelectingRoleEdit(false);
      }
    }
  );

  const saveRolePermission = async () => {
    if (!selectingRole) return;
    updateRoleRun({
      ...selectingRole,
      roleId: selectingRole._id
    });
  };
  const loading = useMemo(() => {
    return getRoleListLoading || updateRoleLoading;
  }, [getRoleListLoading, updateRoleLoading]);
  const contextValue: RoleManageContextType = {
    // 实现具体的状态和方法
    roleList: roleList || [],
    loading,
    selectingRole,
    changeSelectingRole,
    roleListMap,
    editSelectingRole,
    selectingRoleEdit,
    saveRolePermission,
    refreshRoleList
  };

  return <RoleManageContext.Provider value={contextValue}>{children}</RoleManageContext.Provider>;
};

export default RoleManageContextProvider;
