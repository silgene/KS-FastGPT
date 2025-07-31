import { type PerConstructPros, Permission, PermissionBase } from '../controller';
import { PermissionListType } from '../type';
import {
  SpaceDefaultPermissionVal,
  SpacePermissionList,
  SpaceAppReadPermissionVal,
  SpaceAppEditPermissionVal,
  SpaceAppManagePermissionVal,
  SpaceDatasetReadPermissionVal,
  SpaceDatasetEditPermissionVal,
  SpaceDatasetManagePermissionVal,
  SpaceMemberReadPermissionVal,
  SpaceMemberManagePermissionVal,
  SpaceMemberAdminPermissionVal,
  SpaceMemberInvitePermissionVal,
  type SpacePermissionKeyEnum,
  type SpacePermissionListType
} from './constant';

export class SpacePermission extends PermissionBase<SpacePermissionKeyEnum> {
  // 应用相关权限
  hasAppReadPer: boolean = false;
  hasAppEditPer: boolean = false;
  hasAppManagePer: boolean = false;

  // 知识库相关权限
  hasDatasetReadPer: boolean = false;
  hasDatasetCreatePer: boolean = false;
  hasDatasetManagePer: boolean = false;

  // 成员管理相关权限
  hasMemberReadPer: boolean = false;
  hasMemberManagePer: boolean = false;
  hasMemberAdminPer: boolean = false;
  hasMemberInvitePer: boolean = false;

  hasReadPer: boolean = false;

  constructor(props?: PerConstructPros<SpacePermissionKeyEnum>) {
    if (!props) {
      props = {
        per: SpaceDefaultPermissionVal
      };
    } else if (!props?.per) {
      props.per = SpaceDefaultPermissionVal;
    }

    props.permissionList = SpacePermissionList;
    super(props);

    this.setUpdatePermissionCallback(() => {
      this.hasAppReadPer = this.checkPer(SpaceAppReadPermissionVal);
      this.hasAppEditPer = this.checkPer(SpaceAppEditPermissionVal);
      this.hasAppManagePer = this.checkPer(SpaceAppManagePermissionVal);
      this.hasDatasetReadPer = this.checkPer(SpaceDatasetReadPermissionVal);
      this.hasDatasetCreatePer = this.checkPer(SpaceDatasetEditPermissionVal);
      this.hasDatasetManagePer = this.checkPer(SpaceDatasetManagePermissionVal);
      this.hasMemberReadPer = this.checkPer(SpaceMemberReadPermissionVal);
      this.hasMemberManagePer = this.checkPer(SpaceMemberManagePermissionVal);
      this.hasMemberAdminPer = this.checkPer(SpaceMemberAdminPermissionVal);
      this.hasMemberInvitePer = this.checkPer(SpaceMemberInvitePermissionVal);

      this.hasReadPer = this.hasAppReadPer || this.hasDatasetReadPer || this.hasMemberReadPer;
    });
  }
}
