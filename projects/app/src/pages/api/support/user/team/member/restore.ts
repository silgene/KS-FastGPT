import { NextAPI } from '@/service/middleware/entry';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type RestoreMemberBody = {
  tmbId: string;
};

export type RestoreMemberResponse = {
  message: string;
};

async function handler(
  req: ApiRequestProps<RestoreMemberBody>,
  res: ApiResponseType<RestoreMemberResponse>
): Promise<RestoreMemberResponse> {
  const { tmbId } = req.body;

  if (!tmbId) {
    return Promise.reject('Missing required parameter: tmbId');
  }

  // TODO：后续改成团队管理员+root
  const { teamId, tmbId: myTmbId } = await authSystemAdmin({ req });

  await mongoSessionRun(async (session) => {
    // 查找要恢复的成员
    const member = await MongoTeamMember.findById(tmbId).session(session);
    if (!member) {
      return Promise.reject('Member not found');
    }

    if (member.teamId.toString() !== teamId) {
      return Promise.reject('Unauthorized to restore this member');
    }

    // 检查成员当前状态
    if (member.status === TeamMemberStatusEnum.active) {
      return Promise.reject('Member is already active');
    }

    // 恢复成员状态为活跃
    await MongoTeamMember.findByIdAndUpdate(
      tmbId,
      {
        status: TeamMemberStatusEnum.active,
        updateTime: new Date()
      },
      { session }
    );

    // 记录操作日志（使用异步包装）
    (() => {
      addOperationLog({
        tmbId: myTmbId,
        teamId,
        event: OperationLogEventEnum.RECOVER_TEAM_MEMBER, // 假设有这个事件类型
        params: {
          memberName: member.name
        }
      });
    })();
  });

  return {
    message: 'Member restored successfully'
  };
}

export default NextAPI(handler);
