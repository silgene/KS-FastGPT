import { NextAPI } from '@/service/middleware/entry';
import type { UpdateAppCollaboratorBody } from '@fastgpt/global/core/app/collaborator';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

async function handler(req: ApiRequestProps<UpdateAppCollaboratorBody>, res: ApiResponseType) {
  const body = req.body;
  const { teamId } = await authSystemAdmin({ req });
  // TODO: 暂时先做团队成员的协作
  await MongoResourcePermission.bulkWrite(
    (body.members || []).map((member) => {
      return {
        updateOne: {
          filter: {
            tmbId: member,
            resourceId: body.appId,
            teamId,
            resourceType: PerResourceTypeEnum.app
          },
          update: { $set: { permission: body.permission } },
          upsert: true // 如果没有则创建
        }
      };
    })
  );
}
export default NextAPI(handler);
