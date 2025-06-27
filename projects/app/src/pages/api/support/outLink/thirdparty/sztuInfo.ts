import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { plusRequest } from '@fastgpt/service/common/api/plusRequest';
import Cookie from 'cookie';
import axios from 'axios';
import { type SZTUUserInfo } from '@fastgpt/service/support/permission/publish/thirdpartyAuth/sztu';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: ApiRequestProps, res: ApiResponseType<any>): Promise<any> {
  const { shareToken } = Cookie.parse(req.headers.cookie || '');
  if (!shareToken) {
    return;
  }
  const info = await axios.get<SZTUUserInfo>(
    `https://auth.sztu.edu.cn/idp/oauth2/getUserInfo?access_token=${shareToken}&client_id=rxc`
  );
  return info.data;
}

export default NextAPI(handler);
