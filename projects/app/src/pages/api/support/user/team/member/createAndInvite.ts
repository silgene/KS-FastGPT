import { NextAPI } from '@/service/middleware/entry';
import { authSystemAdmin } from '@fastgpt/service/support/permission/user/auth';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { Types } from '@fastgpt/service/common/mongo';
import { hashStr } from '@fastgpt/global/common/string/tools';

export type CreateAndInviteMemberProps = {
  teamId: string;
  users: Array<{
    username: string;
    password: string;
    roleId: string;
  }>;
};

export type CreateAndInviteMemberResponse = {
  created: Array<{ username: string; userId: string }>;
  failed: Array<{ username: string; error: string }>;
  alreadyExists: Array<{ username: string; userId: string }>;
};

async function handler(
  req: ApiRequestProps<CreateAndInviteMemberProps>,
  res: ApiResponseType<CreateAndInviteMemberResponse>
) {
  // 验证权限 - 需要系统管理员权限或团队管理权限
  const { teamId: authTeamId } = await authSystemAdmin({ req });

  const { teamId, users } = req.body;

  // 验证teamId是否匹配
  if (authTeamId !== teamId) {
    throw new Error('无权限操作此团队');
  }

  const result = await mongoSessionRun(async (session) => {
    const created: Array<{ username: string; userId: string }> = [];
    const failed: Array<{ username: string; error: string }> = [];
    const alreadyExists: Array<{ username: string; userId: string }> = [];

    for (const { username, password, roleId } of users) {
      try {
        // 检查用户是否已存在
        const existingUser = await MongoUser.findOne({ username }, '_id', { session }).lean();

        if (existingUser) {
          // 检查是否已在团队中
          const existingMember = await MongoTeamMember.findOne(
            {
              teamId: new Types.ObjectId(teamId),
              userId: existingUser._id
            },
            '_id',
            { session }
          ).lean();

          if (existingMember) {
            alreadyExists.push({ username, userId: String(existingUser._id) });
          } else {
            // 用户存在但不在团队中，将其加入团队
            await MongoTeamMember.create(
              [
                {
                  teamId: new Types.ObjectId(teamId),
                  userId: existingUser._id,
                  name: 'Member',
                  status: TeamMemberStatusEnum.active,
                  createTime: new Date()
                }
              ],
              { session }
            );
            created.push({ username, userId: String(existingUser._id) });
          }
        } else {
          // 创建新用户
          const [newUser] = await MongoUser.create(
            [
              {
                username,
                password: hashStr(password),
                createTime: new Date()
              }
            ],
            { session }
          );

          // 将新用户加入团队
          await MongoTeamMember.create(
            [
              {
                teamId: new Types.ObjectId(teamId),
                userId: newUser._id,
                name: 'Member',
                status: TeamMemberStatusEnum.active,
                createTime: new Date(),
                roleId
              }
            ],
            { session }
          );

          created.push({ username, userId: String(newUser._id) });
        }
      } catch (error) {
        failed.push({
          username,
          error: error instanceof Error ? error.message : '创建用户失败'
        });
      }
    }

    return {
      created,
      failed,
      alreadyExists
    };
  });

  return result;
}

export default NextAPI(handler);
