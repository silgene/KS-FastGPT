import React, { useMemo } from 'react';
import { Box, type ButtonProps } from '@chakra-ui/react';
import MySelect from '@fastgpt/web/components/common/MySelect';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import { type ParseKeys } from '@fastgpt/web/types/i18next';
import { useTranslation } from 'react-i18next';

export type SpacePermissionSelectProps = Omit<ButtonProps, 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
  customButton?: React.ReactNode;
  isOwner?: boolean;
  disabled?: boolean;
  myRoleList: RoleSchemaType[];
};

const SpacePermissionSelect = ({
  value,
  onChange,
  customButton,
  isOwner = false,
  disabled = false,
  myRoleList,
  ...buttonProps
}: SpacePermissionSelectProps) => {
  const { t } = useTranslation();
  const roleList = useMemo(() => {
    if (isOwner) {
      return myRoleList.map((role) => ({
        label: role.defaultRole ? t(role.name as ParseKeys) : role.name,
        value: role._id,
        description: role.defaultRole ? t(role.description as ParseKeys) : role.description
      }));
    }
    return myRoleList
      .filter((role) => role.ownerRole !== true)
      .map((role) => ({
        label: role.defaultRole ? t(role.name as ParseKeys) : role.name,
        value: role._id,
        description: role.defaultRole ? t(role.description as ParseKeys) : role.description
      }));
  }, [myRoleList, isOwner, t]);

  const handleChange = (newRoleId: string) => {
    if (newRoleId !== value && !disabled) {
      onChange(newRoleId);
    }
  };

  return (
    <Box>
      <MySelect
        {...buttonProps}
        list={roleList}
        value={value}
        onChange={handleChange}
        customButton={customButton}
        isDisabled={disabled}
      />
    </Box>
  );
};

export default SpacePermissionSelect;
