import {
  type TeamMemberItemType,
  TeamMemberSchema,
  type TeamSchema,
  type TeamTmbItemType
} from '@fastgpt/global/support/user/team/type';
import { type ClientSession, Types } from '../../../common/mongo';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum,
  notLeaveStatus
} from '@fastgpt/global/support/user/team/constant';
import { MongoTeamMember } from './teamMemberSchema';
import { MongoTeam } from './teamSchema';
import type {
  InviteUserToTeamProps,
  TeamMemberListQuery,
  UpdateTeamProps
} from '@fastgpt/global/support/user/team/controller';
import { getResourcePermission } from '../../permission/controller';
import {
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamDefaultPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoMemberGroupModel } from '../../permission/memberGroup/memberGroupSchema';
import { mongoSessionRun } from '../../../common/mongo/sessionRun';
import { DefaultGroupName } from '@fastgpt/global/support/user/team/group/constant';
import { getAIApi } from '../../../core/ai/config';
import { createRootOrg } from '../../permission/org/controllers';
import { refreshSourceAvatar } from '../../../common/file/image/controller';
import { type PaginationProps } from '@fastgpt/global/common/fetch/type';
import { MongoUser } from '../schema';
import { type UserModelSchema } from '@fastgpt/global/support/user/type';
import { getRoleByTmbId } from '../role/controller';
import { RoleTypeEnum } from '@fastgpt/global/support/user/role/constant';
import { getCustomRole } from '@fastgpt/global/support/user/role/controller';
import { type RoleSchemaType } from '@fastgpt/global/support/user/role/type';
import { MongoRole } from '../role/roleSchema';
import { getRandomUserAvatar } from '@fastgpt/global/support/user/utils';
import { createDefaultPersonalSpace } from '../space/controller';

async function getTeamMember(match: Record<string, any>): Promise<TeamTmbItemType> {
  const tmb = await MongoTeamMember.findOne(match)
    .populate<{ team: TeamSchema }>('team')
    .populate<{ role: RoleSchemaType }>('role')
    .lean();
  if (!tmb) {
    return Promise.reject('member not exist');
  }
  const { permission: Per } = await getRoleByTmbId({
    type: RoleTypeEnum.team,
    tmbId: tmb._id,
    resourceId: tmb.teamId
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
      isOwner: tmb?.role?.ownerRole
    }),
    notificationAccount: tmb.team.notificationAccount,

    lafAccount: tmb.team.lafAccount,
    openaiAccount: tmb.team.openaiAccount,
    externalWorkflowVariables: tmb.team.externalWorkflowVariables
  };
}

export const getTeamOwner = async (teamId: string) => {
  const ownerRole = await MongoRole.findOne({ ownerRole: true, type: RoleTypeEnum.team }).lean();
  if (!ownerRole) return null;
  const tmb = await MongoTeamMember.findOne({ teamId, roleId: ownerRole._id }).lean();
  return tmb;
};

export async function getTmbInfoByTmbId({ tmbId }: { tmbId: string }) {
  if (!tmbId) {
    return Promise.reject('tmbId or userId is required');
  }
  return getTeamMember({
    _id: new Types.ObjectId(String(tmbId)),
    status: notLeaveStatus
  });
}
export async function getTmbInfoByUserIdAndTeamId({
  userId,
  teamId
}: {
  userId: string;
  teamId: string;
}) {
  if (!userId || !teamId) {
    return Promise.reject('tmbId or userId is required');
  }
  return getTeamMember({
    userId: new Types.ObjectId(userId),
    teamId: new Types.ObjectId(teamId),
    status: notLeaveStatus
  });
}
export async function getUserDefaultTeam({ userId }: { userId: string }) {
  if (!userId) {
    return Promise.reject('tmbId or userId is required');
  }
  return getTeamMember({
    userId: new Types.ObjectId(userId)
  });
}

export async function createDefaultTeam({
  userId,
  teamName = 'My Team',
  avatar = '/icon/logo.svg',
  session
}: {
  userId: string;
  teamName?: string;
  avatar?: string;
  session: ClientSession;
}) {
  // auth default team
  const tmb = await MongoTeamMember.findOne({
    userId: new Types.ObjectId(userId)
  });

  if (!tmb) {
    // create team
    const [{ _id: insertedId }] = await MongoTeam.create(
      [
        {
          ownerId: userId,
          name: teamName,
          avatar,
          createTime: new Date()
        }
      ],
      { session }
    );
    // create team member
    const [tmb] = await MongoTeamMember.create(
      [
        {
          teamId: insertedId,
          userId,
          name: 'Owner',
          role: TeamMemberRoleEnum.owner,
          status: TeamMemberStatusEnum.active,
          createTime: new Date()
        }
      ],
      { session }
    );
    // create default group
    await MongoMemberGroupModel.create(
      [
        {
          teamId: tmb.teamId,
          name: DefaultGroupName,
          avatar
        }
      ],
      { session }
    );
    await createRootOrg({ teamId: tmb.teamId, session });
    console.log('create default team, group and root org', userId);
    return tmb;
  } else {
    console.log('default team exist', userId);
  }
}

export async function updateTeam({
  teamId,
  name,
  avatar,
  teamDomain,
  lafAccount,
  openaiAccount,
  externalWorkflowVariable
}: UpdateTeamProps & { teamId: string }) {
  // auth openai key
  if (openaiAccount?.key) {
    console.log('auth user openai key', openaiAccount?.key);
    const baseUrl = openaiAccount?.baseUrl || 'https://api.openai.com/v1';
    openaiAccount.baseUrl = baseUrl;

    const ai = getAIApi({
      userKey: openaiAccount
    });

    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }]
    });
    if (response?.choices?.[0]?.message?.content === undefined) {
      return Promise.reject('Key response is empty');
    }
  }

  return mongoSessionRun(async (session) => {
    const unsetObj = (() => {
      const obj: Record<string, 1> = {};
      if (lafAccount?.pat === '') {
        obj.lafAccount = 1;
      }
      if (openaiAccount?.key === '') {
        obj.openaiAccount = 1;
      }
      if (externalWorkflowVariable) {
        if (externalWorkflowVariable.value === '') {
          obj[`externalWorkflowVariables.${externalWorkflowVariable.key}`] = 1;
        }
      }

      if (Object.keys(obj).length === 0) {
        return undefined;
      }
      return {
        $unset: obj
      };
    })();
    const setObj = (() => {
      const obj: Record<string, any> = {};
      if (lafAccount?.pat && lafAccount?.appid) {
        obj.lafAccount = lafAccount;
      }
      if (openaiAccount?.key && openaiAccount?.baseUrl) {
        obj.openaiAccount = openaiAccount;
      }
      if (externalWorkflowVariable) {
        if (externalWorkflowVariable.value !== '') {
          obj[`externalWorkflowVariables.${externalWorkflowVariable.key}`] =
            externalWorkflowVariable.value;
        }
      }
      if (Object.keys(obj).length === 0) {
        return undefined;
      }
      return obj;
    })();

    // This is where we get the old team
    const team = await MongoTeam.findByIdAndUpdate(
      teamId,
      {
        $set: {
          ...(name ? { name } : {}),
          ...(avatar ? { avatar } : {}),
          ...(teamDomain ? { teamDomain } : {}),
          ...setObj
        },
        ...unsetObj
      },
      { session }
    );

    // Update member group avatar
    if (avatar) {
      await MongoMemberGroupModel.updateOne(
        {
          teamId: teamId,
          name: DefaultGroupName
        },
        {
          avatar
        },
        { session }
      );

      await refreshSourceAvatar(avatar, team?.avatar, session);
    }
  });
}
export async function getTeamMemberList({
  status,
  searchKey,
  pageSize,
  offset,
  teamId
}: PaginationProps<TeamMemberListQuery> & { teamId: string }) {
  const team = await MongoTeam.findById(teamId).lean();
  if (!team) {
    return Promise.reject('团队不存在');
  }
  const userMatch: Record<string, any> = { status: status || TeamMemberStatusEnum.active };
  if (searchKey?.trim().length) {
    userMatch.username = { $regex: searchKey, $options: 'i' };
  }
  const query = MongoTeamMember.find({ teamId })
    .populate<{ user: UserModelSchema }>({
      path: 'user',
      match: userMatch
    })
    .populate<{ role: RoleSchemaType }>('role');

  const res = await query
    .skip(Number(offset) || 0)
    .limit(Number(pageSize) || 10)
    .lean();

  return res
    .filter((item) => item.user)
    .map((item) => {
      return {
        userId: item.userId,
        tmbId: item._id,
        teamId: item.teamId,
        memberName: item.name,
        username: item.user.username,
        avatar: item.avatar,
        role: item.role || getCustomRole(RoleTypeEnum.team, 0, '无角色'),
        status: item.status,
        contact: item.user.contact,
        createTime: item.createTime,
        updateTime: item.updateTime,
        permission: new TeamPermission({
          per: item?.role?.permission || TeamDefaultPermissionVal,
          isOwner: String(team.ownerId) === String(item.userId)
        })
      };
    });
}
export async function getTeamMemberCount(teamId: string) {
  const count = await MongoTeamMember.countDocuments({ teamId }).lean();
  return count;
}
export async function inviteUserToTeam({
  userIds,
  teamId,
  session,
  roleId
}: InviteUserToTeamProps & { session: ClientSession }) {
  if (!userIds?.length) {
    return Promise.reject('userIds is required');
  }
  if (!teamId) {
    return Promise.reject('teamId is required');
  }
  const team = await MongoTeam.findById(teamId).lean();
  if (!team) {
    return Promise.reject('团队不存在');
  }

  const role = await MongoRole.findById(roleId).lean();
  if (!role || role.type !== RoleTypeEnum.team) {
    return Promise.reject('角色不存在');
  }
  const users = await MongoUser.find(
    {
      _id: { $in: userIds }
    },
    'username'
  ).lean<{ username: string; _id: string }[]>();
  const op = users.map((user) => {
    return {
      updateOne: {
        filter: { userId: user._id, teamId },
        update: {
          $set: {
            roleId: role._id,
            status: TeamMemberStatusEnum.active,
            updateTime: new Date()
          },
          $setOnInsert: {
            name: user.username,
            avatar: getRandomUserAvatar()
          }
        },
        upsert: true
      }
    };
  });
  const inserted = await MongoTeamMember.bulkWrite(op, { session });
  for (const tmbId of Object.values(inserted.insertedIds) as string[]) {
    const tmb = await getTmbInfoByTmbId({ tmbId });
    await createDefaultPersonalSpace({
      tmbId,
      name: tmb.memberName + '的个人空间',
      session
    });
  }
}
