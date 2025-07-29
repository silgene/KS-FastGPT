// 系统角色,团队角色,空间角色
export enum RoleTypeEnum {
  system = 'system',
  team = 'team',
  space = 'space'
}
export const RoleTypeNameMap: Record<RoleTypeEnum, string> = {
  [RoleTypeEnum.system]: 'common:role.type.system',
  [RoleTypeEnum.team]: 'common:role.type.team',
  [RoleTypeEnum.space]: 'common:role.type.space'
};
export enum RoleStatusEnum {
  active = 'active',
  inactive = 'inactive'
}
export const RoleCollectionName = 'role';
export const RoleUserCollectionName = 'roleUser';
