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
  SpaceManagePermissionVal,
  SpaceReadPermissionVal,
  SpaceWritePermissionVal
} from '@fastgpt/global/support/permission/space/constant';
import { NullPermission, OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';
import {
  TeamManagePermissionVal,
  TeamReadPermissionVal
} from '@fastgpt/global/support/permission/user/constant';
import { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import MyIconButton from '@fastgpt/web/components/common/Icon/button';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { Permission } from '@fastgpt/global/support/permission/controller';
import { updateRole } from '@/web/support/user/role/api';
import { useToast } from '@fastgpt/web/hooks/useToast';

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
  // TODO: 智能体与知识库的权限需要分开
  {
    label: '智能体',
    permissions: [
      {
        label: '查看/使用智能体',
        val: SpaceReadPermissionVal
      },
      {
        label: '修改/创建智能体',
        val: SpaceWritePermissionVal,
        info: '不能删除他人创建的智能体'
      },
      {
        label: '管理智能体',
        info: '可以管理智能体的所有权限，包括删除',
        val: SpaceManagePermissionVal
      }
    ]
  },
  {
    label: '知识库',
    permissions: [
      {
        label: '查看/使用知识库',
        val: SpaceReadPermissionVal
      },
      {
        label: '修改/创建知识库',
        val: SpaceWritePermissionVal,
        info: '不能删除他人创建的知识库'
      },
      {
        label: '管理知识库',
        info: '可以管理知识库的所有权限，包括删除',
        val: SpaceManagePermissionVal
      }
    ]
  },
  {
    label: '空间成员管理',
    permissions: [
      {
        label: '查看成员',
        val: SpaceReadPermissionVal
      },
      {
        label: '管理成员',
        info: '可以管理成员的所有权限，包括删除',
        val: SpaceManagePermissionVal
      },
      {
        label: '添加管理员',
        info: '可以将其他成员提升为空间管理员',
        val: OwnerPermissionVal
      }
    ]
  }
];
const TeamDetailStructure: RoleDetailStructureType = [
  {
    label: '空间管理',
    permissions: [
      {
        label: '查看所有空间',
        val: TeamReadPermissionVal
      },
      {
        label: '管理所有空间',
        val: TeamManagePermissionVal
      }
    ]
  },
  {
    label: '团队成员管理',
    permissions: [
      {
        label: '查看团队成员',
        val: TeamReadPermissionVal
      },
      {
        label: '管理团队成员',
        info: '可以管理团队成员的所有权限，包括删除',
        val: TeamManagePermissionVal
      },
      {
        label: '添加管理员',
        info: '可以将其他成员提升为管理员',
        val: OwnerPermissionVal
      }
    ]
  }
];
const RoleDetailStructureMap: Partial<Record<`${RoleTypeEnum}`, RoleDetailStructureType>> = {
  [RoleTypeEnum.space]: SpaceDetailStructure,
  [RoleTypeEnum.team]: TeamDetailStructure
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

    console.log('权限更新:', {
      原权限: currentPermission,
      操作权限: permissionVal,
      新权限: newPer
    });
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
