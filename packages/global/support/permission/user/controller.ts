import { type PerConstructPros, Permission, PermissionBase } from '../controller';
import {
  TeamDefaultPermissionVal,
  TeamInviteTeamMemberPermissionVal,
  TeamManageMemberPermissionVal,
  type TeamPermissionKeyEnum,
  TeamPermissionList,
  TeamSpaceManagePermissionVal
} from './constant';

export class TeamPermission extends PermissionBase<TeamPermissionKeyEnum> {
  hasSpaceManagePer: boolean = false;
  hasInviteTeamMemberPer: boolean = false;
  hasManageMemberPer: boolean = false;

  constructor(props?: PerConstructPros<TeamPermissionKeyEnum>) {
    if (!props) {
      props = {
        per: TeamDefaultPermissionVal
      };
    } else if (!props?.per) {
      props.per = TeamDefaultPermissionVal;
    }
    props.permissionList = TeamPermissionList;
    super(props);

    this.setUpdatePermissionCallback(() => {
      this.hasSpaceManagePer = this.checkPer(TeamSpaceManagePermissionVal);
      this.hasInviteTeamMemberPer = this.checkPer(TeamInviteTeamMemberPermissionVal);
      this.hasManageMemberPer = this.checkPer(TeamManageMemberPermissionVal);
    });
  }
}
