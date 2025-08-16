import { MongoSpaceMember } from '@fastgpt/service/support/user/space/spaceMemberSchema';

const test = () => {
  MongoSpaceMember.find({});
};
test();
