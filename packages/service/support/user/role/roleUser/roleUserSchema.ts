import { connectionMongo, getMongoModel } from '../../../../common/mongo';
import {
  RoleCollectionName,
  RoleStatusEnum,
  RoleTypeEnum,
  RoleUserCollectionName
} from '@fastgpt/global/support/user/role/constant';
import { Types } from 'mongoose';
import type { RoleSchemaType, RoleUserSchemaType } from '@fastgpt/global/support/user/role/type';
import { userCollectionName } from '../../../../support/user/schema';
const { Schema } = connectionMongo;
// 角色与用户绑定数据的表
const RoleUserSchema = new Schema({
  roleId: {
    type: Schema.Types.ObjectId,
    ref: RoleCollectionName,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: userCollectionName,
    required: true
  },
  type: {
    type: String,
    enum: RoleTypeEnum,
    required: true
  },
  status: {
    type: String,
    enum: RoleStatusEnum,
    default: RoleStatusEnum.active
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'team',
    required: false
  },
  spaceId: {
    type: Schema.Types.ObjectId,
    ref: 'space',
    required: false
  },

  createTime: {
    type: Date,
    default: () => new Date()
  },
  updateTime: {
    type: Date,
    default: () => new Date()
  }
});

RoleUserSchema.virtual('user', {
  ref: userCollectionName,
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});
RoleUserSchema.virtual('role', {
  ref: RoleCollectionName,
  localField: 'roleId',
  foreignField: '_id',
  justOne: true
});
RoleUserSchema.virtual('team', {
  ref: 'team',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true
});
RoleUserSchema.virtual('space', {
  ref: 'space',
  localField: 'spaceId',
  foreignField: '_id',
  justOne: true
});

try {
  RoleUserSchema.index({ userId: 1, type: 1, status: 1 }, { background: true });
  RoleUserSchema.index({ userId: 1, type: 1, teamId: 1, status: 1 }, { background: true });
  RoleUserSchema.index({ userId: 1, type: 1, spaceId: 1, status: 1 }, { background: true });
} catch (error) {
  console.log(error);
}

export const MongoRoleUser = getMongoModel<RoleUserSchemaType>(
  RoleUserCollectionName,
  RoleUserSchema
);
