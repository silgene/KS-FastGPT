import { MongoUser } from '@fastgpt/service/support/user/schema';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { createDefaultTeam } from '@fastgpt/service/support/user/team/controller';
import { exit } from 'process';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { DefaultRoleList } from '@fastgpt/global/support/user/role/controller';
import { MongoRole } from '@fastgpt/service/support/user/role/roleSchema';

export async function initRootUser(retry = 3): Promise<any> {
  try {
    const rootUser = await MongoUser.findOne({
      username: 'root'
    });
    const psw = process.env.DEFAULT_ROOT_PSW || '123456';

    let rootId = rootUser?._id || '';

    await mongoSessionRun(async (session) => {
      // init root user
      if (rootUser) {
        await rootUser.updateOne({
          password: hashStr(psw)
        });
      } else {
        const [{ _id }] = await MongoUser.create(
          [
            {
              username: 'root',
              password: hashStr(psw)
            }
          ],
          { session, ordered: true }
        );
        rootId = _id;
      }
      // init root team
      await createDefaultTeam({ userId: rootId, session });
      // TODO: 初始化root用户的个人空间
      // await createDefaultPersonalSpace({ tmbId: rootId, session });
    });

    console.log(`root user init:`, {
      username: 'root',
      password: psw
    });
  } catch (error) {
    if (retry > 0) {
      console.log('retry init root user');
      return initRootUser(retry - 1);
    } else {
      console.error('init root user error', error);
      exit(1);
    }
  }
}
export async function initDefaultRole(retry = 3): Promise<any> {
  // 创建初始的团队角色,空间角色
  try {
    await mongoSessionRun(async (session) => {
      for (let i = 0; i < DefaultRoleList.length; i++) {
        const newRole = DefaultRoleList[i];
        await MongoRole.updateOne({ _id: newRole._id }, newRole, { session, upsert: true });
      }
    });
    console.log('DefaultRole initialized');
  } catch (error) {
    if (retry > 0) {
      console.log('retry init system role');
      return initDefaultRole(retry - 1);
    } else {
      console.error('init system role error', error);
      exit(1);
    }
  }
}
