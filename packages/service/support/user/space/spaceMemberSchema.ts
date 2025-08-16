import {
  SpaceCollectionName,
  SpaceMemberCollectionName,
  SpaceMemberStatusEnum
} from '@fastgpt/global/support/user/space/constant';
import { connectionMongo, getMongoModel } from '../../../common/mongo';
import { TeamMemberCollectionName } from '@fastgpt/global/support/user/team/constant';
import { RoleCollectionName } from '@fastgpt/global/support/user/role/constant';
import type { SpaceMemberSchemaType } from '@fastgpt/global/support/user/space/type';
const { Schema } = connectionMongo;

const SpaceMemberSchema = new Schema({
  spaceId: {
    type: Schema.Types.ObjectId,
    ref: SpaceCollectionName,
    required: true
  },
  tmbId: {
    type: Schema.Types.ObjectId,
    ref: TeamMemberCollectionName,
    required: true
  },
  roleId: {
    type: Schema.Types.ObjectId,
    ref: RoleCollectionName,
    required: true
  },
  status: {
    type: String,
    enum: SpaceMemberStatusEnum,
    default: SpaceMemberStatusEnum.active
  },
  createTime: {
    type: Date,
    default: () => new Date()
  }
});
SpaceMemberSchema.virtual('space', {
  ref: SpaceCollectionName,
  localField: 'spaceId',
  foreignField: '_id',
  justOne: true
});
SpaceMemberSchema.virtual('tmb', {
  ref: TeamMemberCollectionName,
  localField: 'tmbId',
  foreignField: '_id',
  justOne: true
});
SpaceMemberSchema.virtual('role', {
  ref: RoleCollectionName,
  localField: 'roleId',
  foreignField: '_id',
  justOne: true
});

try {
  SpaceMemberSchema.index({ spaceId: 1 }, { background: true });
  SpaceMemberSchema.index({ tmbId: 1 }, { background: true });
  SpaceMemberSchema.index({ roleId: 1 }, { background: true });
} catch (error) {
  console.log(error);
}

export const MongoSpaceMember = getMongoModel<SpaceMemberSchemaType>(
  SpaceMemberCollectionName,
  SpaceMemberSchema
);
