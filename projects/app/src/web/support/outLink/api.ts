import { GET, POST, DELETE } from '@/web/common/api/request';
import type {
  OutlinkAppType,
  OutLinkEditType,
  OutLinkSchema
} from '@fastgpt/global/support/outLink/type.d';
import { type SZTUUserInfo } from '@fastgpt/service/support/permission/publish/thirdpartyAuth/sztu';

// create a shareChat
export function createShareChat<T>(
  data: OutLinkEditType<T> & {
    appId: string;
    type: OutLinkSchema['type'];
  }
) {
  return POST<string>(`/support/outLink/create`, data);
}

export const putShareChat = (data: OutLinkEditType) =>
  POST<string>(`/support/outLink/update`, data);

// get shareChat
export function getShareChatList<T extends OutlinkAppType>(data: {
  appId: string;
  type: OutLinkSchema<T>['type'];
}) {
  return GET<OutLinkSchema<T>[]>(`/support/outLink/list`, data);
}

// delete a  shareChat
export function delShareChatById(id: string) {
  return DELETE(`/support/outLink/delete?id=${id}`);
}

// update a shareChat
export function updateShareChat<T extends OutlinkAppType>(data: OutLinkEditType<T>) {
  return POST<string>(`/support/outLink/update`, data);
}
export function getSZTUUserInfo() {
  return GET<SZTUUserInfo>(`/support/outLink/thirdparty/sztuInfo`);
}
// /**
//  * create a shareChat
//  */
// export const createWecomLinkChat = (
//   data: OutLinkConfigEditType & {
//     appId: string;
//     type: OutLinkSchema['type'];
//   }
// ) => POST<string>(`/support/outLink/create`, data);
