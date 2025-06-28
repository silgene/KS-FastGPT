import { type ThirdPartyAuthEnum } from '../outLink/constant';
import type { OutLinkSchema } from '../outLink/type';

type ShareChatAuthProps = {
  shareId?: string;
  outLinkUid?: string;
  shareToken?: string;
  thirdPartyAuth?: OutLinkSchema['thirdPartyAuth'];
};
type TeamChatAuthProps = {
  teamId?: string;
  teamToken?: string;
};
export type OutLinkChatAuthProps = ShareChatAuthProps & TeamChatAuthProps;
