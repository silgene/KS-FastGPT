import {
  type PermissionListType,
  type PermissionBaseListType,
  type PermissionValueType
} from './type';
import {
  PermissionList,
  NullPermission,
  OwnerPermissionVal,
  type PermissionKeyEnum
} from './constant';

export type PerConstructPros<T = PermissionKeyEnum> = {
  per?: PermissionValueType;
  isOwner?: boolean;
  permissionList?: PermissionBaseListType<T>;
  childUpdatePermissionCallback?: () => void;
};

export class PermissionBase<T = PermissionKeyEnum> {
  value: PermissionValueType;
  isOwner: boolean = false;
  _permissionList: PermissionBaseListType<T>;

  constructor(props?: PerConstructPros<T>) {
    const { per = NullPermission, isOwner = false, permissionList } = props || {};
    if (isOwner) {
      this.value = OwnerPermissionVal;
    } else {
      this.value = per;
    }

    this._permissionList = permissionList as PermissionBaseListType<T>;
    this.updatePermissions();
  }

  addPer(...perList: PermissionValueType[]) {
    if (this.isOwner) {
      return this;
    }
    for (const per of perList) {
      this.value = this.value | per;
    }
    this.updatePermissions();
    return this;
  }

  removePer(...perList: PermissionValueType[]) {
    if (this.isOwner) {
      return this.value;
    }
    for (const per of perList) {
      this.value = this.value & ~per;
    }
    this.updatePermissions();
    return this;
  }

  checkPer(perm: PermissionValueType): boolean {
    if (perm === OwnerPermissionVal) {
      return this.value === OwnerPermissionVal;
    }
    return (this.value & perm) === perm;
  }

  protected updatePermissionCallback?: () => void;
  setUpdatePermissionCallback(callback: () => void) {
    callback();
    this.updatePermissionCallback = callback;
  }

  protected updatePermissions() {
    this.isOwner = this.value === OwnerPermissionVal;
    this.updatePermissionCallback?.();
  }

  toBinary() {
    return this.value.toString(2);
  }
}

// Permission 类继承 PermissionBase，添加 read、write、manage 权限检查
export class Permission extends PermissionBase<PermissionKeyEnum> {
  hasManagePer: boolean = false;
  hasWritePer: boolean = false;
  hasReadPer: boolean = false;

  constructor(props?: PerConstructPros<PermissionKeyEnum>) {
    const { permissionList = PermissionList, ...restProps } = props || {};
    super({ ...restProps, permissionList });
  }

  protected updatePermissions() {
    super.updatePermissions();
    this.hasManagePer = this.checkPer(this._permissionList['manage'].value);
    this.hasWritePer = this.checkPer(this._permissionList['write'].value);
    this.hasReadPer = this.checkPer(this._permissionList['read'].value);
  }
}
