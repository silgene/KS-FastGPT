import { authUserSession } from '../../../user/session';
import { type AuthThirdPartyTokenValidFn, type AuthThirdPartyLoginFn } from './auth';
import Cookie from 'cookie';
import axios from 'axios';

export const SZTUAuthThirdPartyTokenValid: AuthThirdPartyTokenValidFn = async (shareToken) => {
  if (!shareToken) {
    return false;
  }
  try {
    const res = await axios.get<{
      result: boolean;
    }>(`https://auth.sztu.edu.cn/idp/oauth2/checkTokenValid?access_token=${shareToken}`);
    return res.data.result;
  } catch (error) {
    return false;
  }
};

export const SZTUAuthThirdPartyLogin: AuthThirdPartyLoginFn = async (context) => {
  const { code } = context.query;
  // 统一身份认证
  const res = await axios.post<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    uid: string;
  }>(
    `https://auth.sztu.edu.cn/idp/oauth2/getToken?client_id=rxc&grant_type=authorization_code&code=${code}&client_secret=38d81c709ef14e74ad630fdcb09bff06`,
    {}
  );
  // console.log('SZTUAuthThirdPartyLogin res', res.data);
  const shareToken = res.data.access_token;
  const isValid = await SZTUAuthThirdPartyTokenValid(shareToken);
  return {
    success: isValid,
    shareToken: isValid ? shareToken : undefined
  };
};
export const SZTUAuthThirdPartyRedirectLoginUrl = (url: string) => {
  return `https://auth.sztu.edu.cn/idp/oauth2/authorize?redirect_uri=${url}&state=state&client_id=rxc&response_type=code`;
};
export type SZTUUserInfo = {
  country: any;
  sorgId: any;
  updateDate: string;
  mail: any;
  gender: any;
  loginType: any;
  nation: any;
  displayName: string;
  positionNumber: any;
  title: any;
  loginInterceptFlagTwo: number;
  loginInterceptFlagFour: number;
  employeeNumber: any;
  changePwdAt: string;
  spRoleList: any[];
  uid: string;
  pwdPolicy: string;
  loginInterceptFlagFive: number;
  loginInterceptFlagThree: number;
  identityNumber: any;
  identityType: any;
  loginName: string;
  secAccValid: number;
  pinyinShortName: any;
  orgNumber: string;
  wechatNo: any;
  orgNamePath: string;
  passwordModifyRequired: number;
  birthDay: string;
  givenName: any;
  mobile: string;
  loginInterceptFlagOne: number;
  certSn: any;
  employeeType: string;
  orgCodePath: string;
  otpKey: any;
  positionStatus: any;
  departmentNumber: any;
  certDn: any;
  spNameList: any[];
  isPassRemind: number;
};
