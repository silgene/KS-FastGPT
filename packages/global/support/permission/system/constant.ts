// 系统级别的管理权限
export enum SystemPermissionKeyEnum {
  // 管理系统中所有团队
  teamManage = 'teamManage',
  // 管理所有用户
  userManage = 'userManage',
  // 可以创建新用户
  userCreate = 'userCreate',
  // 可以管理模型设置
  modelManage = 'modelManage',
  // 可以查看系统日志
  systemLogRead = 'systemLogRead'
}
