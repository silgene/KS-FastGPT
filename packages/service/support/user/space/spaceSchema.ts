import { connectionMongo, getMongoModel } from '../../../common/mongo';
const { Schema } = connectionMongo;
import {
  TeamMemberCollectionName,
  TeamCollectionName
} from '@fastgpt/global/support/user/team/constant';
import { getRandomUserAvatar } from '@fastgpt/global/support/user/utils';
import { SpaceCollectionName, SpaceTypeEnum } from '@fastgpt/global/support/user/space/constant';
import { type SpaceSchemaType } from '@fastgpt/global/support/user/space/type';

const SpaceSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  avatar: {
    type: String,
    default: () => getRandomUserAvatar()
  },
  createTime: {
    type: Date,
    default: () => new Date()
  },
  type: {
    type: String,
    enum: SpaceTypeEnum,
    default: 'team'
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: TeamMemberCollectionName,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
});

SpaceSchema.virtual('team', {
  ref: TeamCollectionName,
  localField: 'teamId',
  foreignField: '_id',
  justOne: true
});
SpaceSchema.virtual('tmb', {
  ref: TeamMemberCollectionName,
  localField: 'ownerId',
  foreignField: '_id',
  justOne: true
});

try {
  SpaceSchema.index({ teamId: 1 }, { background: true });
  SpaceSchema.index({ ownerId: 1 }, { background: true });
} catch (error) {
  console.log(error);
}

export const MongoSpace = getMongoModel<SpaceSchemaType>(SpaceCollectionName, SpaceSchema);
