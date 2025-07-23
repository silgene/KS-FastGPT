import { type PerConstructPros, Permission } from '../controller';
import { SpaceDefaultPermissionVal } from './constant';

export class SpacePermission extends Permission {
  constructor(props?: PerConstructPros) {
    if (!props) {
      props = {
        per: SpaceDefaultPermissionVal
      };
    } else if (!props?.per) {
      props.per = SpaceDefaultPermissionVal;
    }
    super(props);
  }
}
