import { type SpaceMemberStatusEnum } from './constant';

export type AddMembersPropsType = {
  tmbs: string[];
  roleId: string;
  spaceId: string;
};
export type AddUpdateSpacePropsType = {
  _id?: string;
  name: string;
  description?: string;
  avatar?: string;
};
export type GetSpaceMemberListPropsType = {
  spaceId: string;
  status?: SpaceMemberStatusEnum;
  searchKey?: string;
};
