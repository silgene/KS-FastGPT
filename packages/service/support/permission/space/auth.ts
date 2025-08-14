import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { MongoSpace } from '../../../support/user/space/spaceSchema';
import type { AuthModeType, AuthResponseType } from '../type';
import { getResourcePermission, parseHeaderCert } from '../controller';
import { SpaceErrEnum } from '@fastgpt/global/common/error/code/space';
import type { SpaceDetailType, SpaceSchemaType } from '@fastgpt/global/support/user/space/type';
import { getTmbInfoByTmbId } from '../../../support/user/team/controller';
import { SpacePermission } from '@fastgpt/global/support/permission/space/controller';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { SpaceDefaultPermissionVal } from '@fastgpt/global/support/permission/space/constant';
import { SpaceTypeEnum } from '@fastgpt/global/support/user/space/constant';
import type { TeamSchema } from '@fastgpt/global/support/user/team/type';
import { getRoleByTmbId } from '../../../support/user/role/controller';
import { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';

export const authSpaceByTmbId = async ({
  tmbId,
  spaceId,
  per,
  isRoot
}: {
  tmbId: string;
  spaceId: string;
  per: PermissionValueType;
  isRoot?: boolean;
}): Promise<{ space: SpaceDetailType }> => {
  // 获取团队id和该团队成员权限
  const { teamId, permission: tmbPer } = await getTmbInfoByTmbId({ tmbId });

  const space = await (async () => {
    const space = await MongoSpace.findOne({ _id: spaceId })
      .populate<{ team: TeamSchema }>('team')
      .lean();

    if (!space) {
      return Promise.reject(SpaceErrEnum.unExist);
    }
    // 如果是个人空间,则只能有一个成员
    if (space.type === SpaceTypeEnum.personal) {
      if (String(space.ownerId) !== tmbId) {
        return Promise.reject(SpaceErrEnum.unAuthSpace);
      }
      return {
        ...space,
        permission: new SpacePermission({ isOwner: true })
      };
    }
    // 如果是root管理员,则直接返回拥有所有权限
    if (isRoot) {
      return {
        ...space,
        permission: new SpacePermission({ allPer: true })
      };
    }
    // 如果该空间不是该团队的,则返回未授权
    if (String(space.teamId) !== teamId) {
      return Promise.reject(SpaceErrEnum.unAuthSpace);
    }
    // 空间创建者拥有所有权限，是拥有者
    const isOwner = String(space.ownerId) === String(tmbId);
    // 如果团队权限中有管理所有空间的权限,则拥有所有权限
    const allPer = tmbPer.hasSpaceManagePer;
    const { Per } = await (async () => {
      if (isOwner) {
        return {
          Per: new SpacePermission({ isOwner: true })
        };
      } else if (allPer) {
        return {
          Per: new SpacePermission({ allPer: true })
        };
      }
      // 获取这个tmb对该空间的权限
      const role = await getRoleByTmbId({
        type: RoleTypeEnum.space,
        tmbId,
        resourceId: spaceId
      });
      const Per = new SpacePermission({ per: role.permission ?? SpaceDefaultPermissionVal });
      return { Per };
    })();

    if (!Per.checkPer(per)) {
      return Promise.reject(SpaceErrEnum.unAuthSpace);
    }

    return {
      ...space,
      permission: Per
    };
  })();
  if (!space) {
    return Promise.reject(SpaceErrEnum.unExist);
  }
  return {
    space: space as SpaceDetailType
  };
};

export const authSpace = async ({
  spaceId,
  per,
  ...props
}: AuthModeType & {
  spaceId: string;
  per: PermissionValueType;
}): Promise<
  AuthResponseType<SpacePermission> & {
    space: SpaceDetailType;
  }
> => {
  const result = await parseHeaderCert(props);
  const { tmbId } = result;
  if (!spaceId) {
    return Promise.reject(SpaceErrEnum.unExist);
  }
  const { space } = await authSpaceByTmbId({ tmbId, spaceId, per });
  return {
    ...result,
    permission: space.permission,
    space
  };
};
