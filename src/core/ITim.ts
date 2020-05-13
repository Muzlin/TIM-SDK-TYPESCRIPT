interface OPTIONS {
  SDKAppID: string
  logLevel?: number
}
interface HOOKS {
  onReady(): void
}
/**
 * SDK接口
 *
 * @interface ITim
 */
interface ITim {
  /** 登录 */
  login(userId: string, userSig: string): Promise<object>

  /** 加入群组 */
  joinGroup(groupId: string, type: string): Promise<object>

  /** 更新资料 */
  updateInfo(nick: string, avatar: string, selfSignature: string): Promise<object>

  /** 获取群成员信息 */
  getGroupMemberProfile(userIdList: [string], groupId: string): Promise<object>

  /** 发送文本消息 */
  sendMessage(to: string, text: string, conversationType: string): Promise<object>

  /** 重发消息 */
  resendMessage(message: any): Promise<object>
}
