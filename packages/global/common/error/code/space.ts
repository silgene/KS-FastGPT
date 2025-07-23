import { type ErrType } from '../errorCode';
import { i18nT } from '../../../../web/i18n/utils';
/* dataset: 510000 */
export enum SpaceErrEnum {
  unExist = 'spaceUnExist',
  unAuthSpace = 'unAuthSpace'
}
const spaceErrList = [
  {
    statusText: SpaceErrEnum.unExist,
    message: i18nT('space:space_error.not_exist')
  },
  {
    statusText: SpaceErrEnum.unAuthSpace,
    message: i18nT('space:space_error.un_auth_space')
  }
];
export default spaceErrList.reduce((acc, cur, index) => {
  return {
    ...acc,
    [cur.statusText]: {
      code: 510000 + index,
      statusText: cur.statusText,
      message: cur.message,
      data: null
    }
  };
}, {} as ErrType<`${SpaceErrEnum}`>);
