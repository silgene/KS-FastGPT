import { type PerConstructPros, PermissionBase } from '../controller';
import {
  SystemAgentStoreManagePermissionVal,
  SystemDefaultPermissionVal,
  SystemFrontManagePermissionVal,
  SystemModelManagePermissionVal,
  SystemPermissionList,
  SystemReadLogPermissionVal,
  SystemTeamCreatePermissionVal,
  SystemTeamManagePermissionVal,
  SystemUserManagePermissionVal,
  type SystemPermissionKeyEnum
} from './constant';

export class SystemPermission extends PermissionBase<SystemPermissionKeyEnum> {
  hasTeamManagePer: boolean = false;
  hasTeamCreatePer: boolean = false;
  hasUserManagePer: boolean = false;
  hasUserCreatePer: boolean = false;
  hasModelManagePer: boolean = false;
  hasReadSystemLogPer: boolean = false;
  hasAgentStoreManagePer: boolean = false;
  hasFrontManagePer: boolean = false;

  constructor(props?: PerConstructPros<SystemPermissionKeyEnum>) {
    if (!props) {
      props = {
        per: SystemDefaultPermissionVal
      };
    } else if (!props?.per) {
      props.per = SystemDefaultPermissionVal;
    }

    props.permissionList = SystemPermissionList;
    super(props);

    this.setUpdatePermissionCallback(() => {
      this.hasTeamManagePer = this.checkPer(SystemTeamManagePermissionVal);
      this.hasTeamCreatePer = this.checkPer(SystemTeamCreatePermissionVal);
      this.hasUserManagePer = this.checkPer(SystemUserManagePermissionVal);
      this.hasUserCreatePer = this.checkPer(SystemUserManagePermissionVal);
      this.hasModelManagePer = this.checkPer(SystemModelManagePermissionVal);
      this.hasReadSystemLogPer = this.checkPer(SystemReadLogPermissionVal);
      this.hasAgentStoreManagePer = this.checkPer(SystemAgentStoreManagePermissionVal);
      this.hasFrontManagePer = this.checkPer(SystemFrontManagePermissionVal);
    });
  }
}
