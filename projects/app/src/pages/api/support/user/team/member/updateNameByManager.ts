import { NextAPI } from '@/service/middleware/entry';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type UpdateMemberNameByManagerBody = {
  tmbId: string;
  name: string;
};

export type UpdateMemberNameByManagerResponse = {
  message: string;
};

async function handler(
  req: ApiRequestProps<UpdateMemberNameByManagerBody>,
  res: ApiResponseType<UpdateMemberNameByManagerResponse>
): Promise<UpdateMemberNameByManagerResponse> {
  const { tmbId, name } = req.body;

  if (!tmbId || !name) {
    return Promise.reject('Missing required parameters: tmbId and name');
  }

  // 验证名字长度
  if (name.trim().length === 0) {
    return Promise.reject('Name cannot be empty');
  }

  if (name.length > 20) {
    return Promise.reject('Name is too long (max 20 characters)');
  }

  // TODO：后续改成团队管理员+root
  const { teamId, tmbId: myTmbId } = await authSystemAdmin({ req });

  await mongoSessionRun(async (session) => {
    // 查找要更新的成员
    const member = await MongoTeamMember.findById(tmbId).session(session);
    if (!member) {
      return Promise.reject('Member not found');
    }

    if (member.teamId.toString() !== teamId) {
      return Promise.reject('Unauthorized to update this member');
    }

    // 保存旧名字用于日志记录
    const oldName = member.name;

    // 更新成员名字
    await MongoTeamMember.findByIdAndUpdate(
      tmbId,
      {
        name: name.trim(),
        updateTime: new Date()
      },
      { session }
    );
  });

  return {
    message: 'Member name updated successfully'
  };
}

export default NextAPI(handler);
