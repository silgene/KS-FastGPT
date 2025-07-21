import { NextAPI } from '@/service/middleware/entry';
import type { UpdateAppCollaboratorBody } from '@fastgpt/global/core/app/collaborator';
import type { CollaboratorItemType } from '@fastgpt/global/support/permission/collaborator';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { Permission } from '@fastgpt/global/support/permission/controller';
import type { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

async function handler(
  req: ApiRequestProps<{}, { appId: string }>,
  res: ApiResponseType<CollaboratorItemType[]>
) {
  // TODO: 只需要验证用户是否有管理这个app的权限
  const { teamId } = await authSystemAdmin({ req });
  const list = await MongoResourcePermission.find({
    resourceId: req.query.appId,
    teamId,
    resourceType: PerResourceTypeEnum.app
  }).populate<{ tmb: TeamMemberSchema }>('tmb');
  return list.map((item) => {
    return {
      teamId,
      permission: new Permission({
        per: item.permission
      }),
      name: item.tmb?.name,
      tmbId: item.tmbId,
      avatar: item.tmb?.avatar
    } as CollaboratorItemType;
  });
}
export default NextAPI(handler);
