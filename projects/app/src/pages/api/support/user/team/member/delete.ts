import { NextAPI } from '@/service/middleware/entry';
import { authSystemAdmin, authTeam } from '@fastgpt/service/support/permission/user/auth';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import { TeamManageMemberPermissionVal } from '@fastgpt/global/support/permission/user/constant';

export type DeleteMemberQuery = {
  tmbId: string;
};

export type DeleteMemberResponse = {
  message: string;
};

async function handler(
  req: ApiRequestProps<{}, DeleteMemberQuery>,
  res: ApiResponseType<DeleteMemberResponse>
): Promise<DeleteMemberResponse> {
  // 从 query 参数获取 tmbId，而不是 body
  const { tmbId } = req.query as DeleteMemberQuery;

  if (!tmbId) {
    return Promise.reject('Missing required parameter: tmbId');
  }
  // 查找要删除的成员
  const member = await MongoTeamMember.findById(tmbId).populate<{ role: RoleSchemaType }>('role');
  if (!member) {
    return Promise.reject('Member not found');
  }
  const { tmbId: operatorTmbId } = await authTeam({
    req,
    teamId: String(member.teamId),
    authToken: true,
    per: TeamManageMemberPermissionVal
  });
  // 检查是否尝试删除团队所有者
  if (member.role?.ownerRole) {
    return Promise.reject('Cannot delete team owner');
  }

  await mongoSessionRun(async (session) => {
    // 更新成员状态为已离职
    // TODO: 无团队成员登录时，跳转到无团队界面
    await MongoTeamMember.findByIdAndUpdate(
      tmbId,
      {
        status: TeamMemberStatusEnum.forbidden,
        updateTime: new Date()
      },
      { session }
    );

    // 记录操作日志（使用异步包装）
    (() => {
      addOperationLog({
        tmbId: operatorTmbId, // 使用teamId作为操作者
        teamId: member.teamId,
        event: OperationLogEventEnum.KICK_OUT_TEAM,
        params: {
          memberName: member.name
        }
      });
    })();
  });

  return {
    message: 'Member deleted successfully'
  };
}

export default NextAPI(handler);
