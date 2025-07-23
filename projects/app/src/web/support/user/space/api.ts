import { GET, POST, PUT } from '@/web/common/api/request';
import type { SpaceDetailType } from '@fastgpt/global/support/user/space/type';

export const getLastUsedSpace = () =>
  GET<SpaceDetailType>('/support/user/space/lastUsedSpace', {}, { maxQuantity: 1 });

export const getAllAccessibleSpaces = () => GET<SpaceDetailType[]>('/support/user/space/list');
