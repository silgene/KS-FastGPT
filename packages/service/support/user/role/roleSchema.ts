import { connectionMongo, getMongoModel } from '../../../common/mongo';
import {
  RoleCollectionName,
  RoleStatusEnum,
  RoleTypeEnum
} from '@fastgpt/global/support/user/role/constant';
import { Types } from 'mongoose';
import type { RoleSchemaType } from '@fastgpt/global/support/user/role/type';
const { Schema } = connectionMongo;
// 角色模板数据表
const RoleSchema = new Schema({
  name: {
    type: String,
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
  // TODO: 如果后续需要某个空间/某个团队的角色可以自定义，则需要添加 customId 字段
  // customId: {
  //   type: Types.ObjectId
  // },
  permission: {
    type: Number,
    require: true
  },
  description: {
    type: String,
    default: ''
  },
  createTime: {
    type: Date,
    default: () => new Date()
  },
  tagColor: {
    type: String,
    default: '#1677ff' // 默认蓝色
  },
  defaultRole: {
    type: Boolean,
    default: false // 是否为系统自带角色
  },
  // 所有者角色一定是系统自带角色,不能自主添加
  ownerRole: {
    type: Boolean,
    default: false // 是否为所有者角色
  }
});
try {
  RoleSchema.index({ createTime: 1 }, { background: true });
} catch (error) {
  console.log(error);
}

export const MongoRole = getMongoModel<RoleSchemaType>(RoleCollectionName, RoleSchema);
