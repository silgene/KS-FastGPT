import {
  Box,
  Checkbox,
  Flex,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tooltip,
  Tr
} from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useContextSelector } from 'use-context-selector';
import { RoleManageContext } from './context';
import { SpacePermission } from '@fastgpt/global/support/permission/space/controller';
import {
  SpaceAppEditPermissionVal,
  SpaceAppReadPermissionVal,
  SpaceAppManagePermissionVal,
  SpaceDatasetEditPermissionVal,
  SpaceDatasetReadPermissionVal,
  SpaceDatasetManagePermissionVal,
  SpaceMemberReadPermissionVal,
  SpaceMemberManagePermissionVal,
  SpaceMemberAdminPermissionVal,
  SpaceMemberInvitePermissionVal
} from '@fastgpt/global/support/permission/space/constant';
import { NullPermission, OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';
import {
  TeamManageMemberPermissionVal,
  TeamSpaceManagePermissionVal,
  TeamInviteTeamMemberPermissionVal
} from '@fastgpt/global/support/permission/user/constant';
import { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import MyIconButton from '@fastgpt/web/components/common/Icon/button';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { Permission } from '@fastgpt/global/support/permission/controller';
import { updateRole } from '@/web/support/user/role/api';
import { useToast } from '@fastgpt/web/hooks/useToast';
import {
  SystemAgentStoreManagePermissionVal,
  SystemFrontManagePermissionVal,
  SystemModelManagePermissionVal,
  SystemReadLogPermissionVal,
  SystemTeamCreatePermissionVal,
  SystemTeamManagePermissionVal,
  SystemUserCreatePermissionVal,
  SystemUserManagePermissionVal
} from '@fastgpt/global/support/permission/system/constant';
export type RoleDetailStructureType = {
  label: string;
  permissions: {
    label: string;
    val: PermissionValueType;
    info?: string;
  }[];
}[];

// TODO: 需要添加国际化
const SpaceDetailStructure: RoleDetailStructureType = [
  {
    label: '智能体',
    permissions: [
      {
        label: '查看/使用智能体',
        val: SpaceAppReadPermissionVal
      },
      {
        label: '修改/创建智能体',
        val: SpaceAppEditPermissionVal,
        info: '不能删除他人创建的智能体'
      },
      {
        label: '管理智能体',
        info: '可以管理智能体的所有权限，包括删除',
        val: SpaceAppManagePermissionVal
      }
    ]
  },
  {
    label: '知识库',
    permissions: [
      {
        label: '查看/使用知识库',
        val: SpaceDatasetReadPermissionVal
      },
      {
        label: '修改/创建知识库',
        val: SpaceDatasetEditPermissionVal,
        info: '不能删除他人创建的知识库'
      },
      {
        label: '管理知识库',
        info: '可以管理知识库的所有权限，包括删除',
        val: SpaceDatasetManagePermissionVal
      }
    ]
  },
  {
    label: '空间成员管理',
    permissions: [
      {
        label: '查看成员',
        val: SpaceMemberReadPermissionVal
      },
      {
        label: '管理成员',
        info: '可以管理成员的所有权限，包括删除',
        val: SpaceMemberManagePermissionVal
      },
      {
        label: '添加管理员',
        info: '可以将其他成员提升为空间管理员',
        val: SpaceMemberAdminPermissionVal
      }
    ]
  }
];
const TeamDetailStructure: RoleDetailStructureType = [
  {
    label: '空间管理',
    permissions: [
      {
        label: '管理所有空间',
        val: TeamSpaceManagePermissionVal
      }
    ]
  },
  {
    label: '团队成员管理',
    permissions: [
      {
        label: '管理团队成员',
        info: '可以管理团队成员的所有权限，包括删除',
        val: TeamManageMemberPermissionVal
      },
      {
        label: '邀请团队成员',
        info: '可以将其他成员提升为管理员',
        val: TeamInviteTeamMemberPermissionVal
      }
    ]
  }
];
const SystemDetailStructure: RoleDetailStructureType = [
  // 系统团队管理
  {
    label: '团队相关',
    permissions: [
      {
        label: '管理所有团队',
        info: '可以管理所有团队的成员和空间',
        val: SystemTeamManagePermissionVal
      },
      {
        label: '创建团队',
        info: '可以创建新的团队',
        val: SystemTeamCreatePermissionVal
      }
    ]
  },
  {
    label: '用户相关',
    permissions: [
      {
        label: '用户管理',
        info: '可以管理所有用户',
        val: SystemUserManagePermissionVal
      },
      {
        label: '用户创建',
        info: '可以创建新的用户',
        val: SystemUserCreatePermissionVal
      }
    ]
  },
  {
    label: '系统权限',
    permissions: [
      {
        label: '模型管理',
        info: '可以管理所有模型',
        val: SystemModelManagePermissionVal
      },
      {
        label: '系统日志查看',
        info: '可以查看系统日志',
        val: SystemReadLogPermissionVal
      },
      {
        label: '智能体中心管理',
        info: '可以管理智能体中心的所有内容',
        val: SystemAgentStoreManagePermissionVal
      },
      {
        label: '前台管理',
        info: '可以管理前台的所有内容',
        val: SystemFrontManagePermissionVal
      }
    ]
  }
];
const RoleDetailStructureMap: Partial<Record<`${RoleTypeEnum}`, RoleDetailStructureType>> = {
  [RoleTypeEnum.space]: SpaceDetailStructure,
  [RoleTypeEnum.team]: TeamDetailStructure,
  [RoleTypeEnum.system]: SystemDetailStructure
};

const RoleDetail = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const selectingRole = useContextSelector(RoleManageContext, (context) => context.selectingRole);
  const editSelectingRole = useContextSelector(
    RoleManageContext,
    (context) => context.editSelectingRole
  );
  const selectingRolePermission = useMemo(() => {
    return new Permission({ per: selectingRole?.permission || 0 });
  }, [selectingRole]);

  const handlePermissionChange = (permissionVal: PermissionValueType) => {
    if (!selectingRole) return;

    const currentPermission = selectingRole.permission || 0;
    const permission = new Permission({ per: currentPermission });

    let newPer: number;

    if (permission.checkPer(permissionVal)) {
      newPer = currentPermission ^ permissionVal;
    } else {
      newPer = currentPermission | permissionVal;
    }

    const updatedRole = {
      ...selectingRole,
      permission: newPer
    };

    editSelectingRole(updatedRole);
  };

  return (
    <Box w={'100%'} fontWeight={'500'}>
      <TableContainer>
        <Table variant="simple" size={'sm'}>
          <Thead height={'2rem'}>
            <Tr>
              <Th bgColor="myGray.100" borderLeftRadius="6px" w={'20%'}>
                模块
              </Th>
              <Th bgColor="myGray.100">权限</Th>
              <Th borderRightRadius="6px" bgColor="myGray.100">
                操作
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {RoleDetailStructureMap[selectingRole?.type || RoleTypeEnum.space]?.map((item) => {
              return (
                <Tr key={item.label}>
                  <Td>{item.label}</Td>
                  <Td p={0}>
                    <Flex flexDir={'column'}>
                      {item.permissions.map((per, idx) => {
                        return (
                          <Box
                            py={3}
                            px={4}
                            key={per.label}
                            borderBottom={idx === item.permissions.length - 1 ? 0 : undefined}
                          >
                            <Flex alignItems={'center'}>
                              {per.label}
                              {per.info ? (
                                <MyTooltip label={per.info}>
                                  <MyIconButton icon={'common/info'}></MyIconButton>
                                </MyTooltip>
                              ) : (
                                <></>
                              )}
                            </Flex>
                          </Box>
                        );
                      })}
                    </Flex>
                  </Td>
                  <Td p={0}>
                    <Flex flexDir={'column'} height={'100%'}>
                      {item.permissions.map((per, idx) => {
                        return (
                          <Box
                            py={3}
                            px={4}
                            key={per.label}
                            borderBottom={idx === item.permissions.length - 1 ? 0 : undefined}
                            gap={2}
                          >
                            <Flex alignItems={'center'} h={'100%'}>
                              <Checkbox
                                disabled={selectingRole?.defaultRole}
                                isChecked={selectingRolePermission.checkPer(per.val)}
                                onChange={() => handlePermissionChange(per.val)}
                              />
                            </Flex>
                          </Box>
                        );
                      })}
                    </Flex>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};
export default React.memo(RoleDetail);
