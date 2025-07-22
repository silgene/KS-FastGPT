import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamDefaultPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import type { TeamTmbItemType, TeamSchema } from '@fastgpt/global/support/user/team/type';
import { Types } from 'mongoose';

export type GetTeamListQuery = {
  status?: `${TeamMemberStatusEnum}`;
};

export type GetTeamListResponse = TeamTmbItemType[];

async function handler(
  req: ApiRequestProps<{}, GetTeamListQuery>,
  res: ApiResponseType<GetTeamListResponse>
): Promise<GetTeamListResponse> {
  const { status = TeamMemberStatusEnum.active } = req.query;

  // 验证用户权限
  const { userId } = await authUserPer({
    req,
    authToken: true,
    per: undefined // 获取自己的团队列表不需要特殊权限
  });

  // 查询用户所属的团队成员记录
  const teamMembers = await MongoTeamMember.find({
    userId: new Types.ObjectId(userId),
    status
  })
    .populate<{ team: TeamSchema }>('team')
    .lean();

  // 构建返回数据
  const teamList: TeamTmbItemType[] = await Promise.all(
    teamMembers.map(async (tmb) => {
      if (!tmb.team) {
        throw new Error('Team not found');
      }

      // 获取团队权限
      const Per = await getResourcePermission({
        resourceType: PerResourceTypeEnum.team,
        teamId: tmb.teamId,
        tmbId: tmb._id
      });

      return {
        userId: String(tmb.userId),
        teamId: String(tmb.teamId),
        teamAvatar: tmb.team.avatar,
        teamName: tmb.team.name,
        memberName: tmb.name,
        avatar: tmb.avatar,
        balance: tmb.team.balance,
        tmbId: String(tmb._id),
        teamDomain: tmb.team?.teamDomain,
        role: tmb.role,
        status: tmb.status,
        permission: new TeamPermission({
          per: Per ?? TeamDefaultPermissionVal,
          isOwner: tmb.role === TeamMemberRoleEnum.owner
        }),
        notificationAccount: tmb.team.notificationAccount,
        lafAccount: tmb.team.lafAccount,
        openaiAccount: tmb.team.openaiAccount,
        externalWorkflowVariables: tmb.team.externalWorkflowVariables
      };
    })
  );

  return teamList;
}

export default NextAPI(handler);
