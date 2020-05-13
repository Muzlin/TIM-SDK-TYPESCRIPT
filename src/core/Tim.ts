import TIM from 'tim-js-sdk'
import EventEmitter from './EventEmitter'
import { replaceSpace, validationOptions, getSdkAppId } from '../utils/index'
import { registerEvent } from './event'
interface OWN_DATA {
  GROUP_ID: string
  USER_ID: string
  NICK: string
  ROLE: string
  USER_SIG: string
  MUTE: number
}
/**
 * SDK Tim实现类
 *
 * @class Tim
 * @implements {ITim}
 */
class Tim implements ITim {
  private isInit: boolean = false
  private tim: any = null
  private SDKReady: boolean = false
  private myEvent: any
  private OWN: OWN_DATA
  constructor(hooks: HOOKS, options?: OPTIONS) {
    options = Object.assign({ SDKAppID: getSdkAppId(), logLevel: 3 }, options)
    validationOptions(options)
    options.logLevel = 3
    this.initSdk(options, hooks)
    // 实例化事件类
    this.myEvent = new EventEmitter()
  }

  //#region 私有方法

  /** 初始化 */
  private initSdk(options: OPTIONS, hooks: HOOKS): void {
    if (!this.isInit) {
      // 创建TIM事列
      this.tim = TIM.create(options)
      // 设置日志级别
      this.tim.setLogLevel(options.logLevel)
      // 监听事件
      this.tim.on(TIM.EVENT.SDK_READY, this.onReady, this) // 监听SDK加载完可以执行鉴权请求事件
      // this.tim.on(TIM.EVENT.CONVERSATION_LIST_UPDATED, this.onConversationListUpdated, this) // 监听会话列表更改事件
      this.tim.on(TIM.EVENT.MESSAGE_RECEIVED, this.onMessageReceived, this) // 监听收到群消息、通知等事件
      this.tim.on(TIM.EVENT.SDK_NOT_READY, this.notReady, this) // SDK NOT READY
      this.tim.on(TIM.EVENT.KICKED_OUT, this.onOut, this) // 签名过期、账号被踢
      // 自定义事件注册
      registerEvent(hooks, this.myEvent, this.tim, TIM)
      this.isInit = true
    }
  }
  /** 登录完成 */
  private onReady() {
    this.SDKReady = true
    this.myEvent('onReady')
  }
  /** SDK 进入 not ready 状态 */
  private notReady() {
    this.SDKReady = false
    this.myEvent.emit('onNotReady')
  }
  /** 签名过期、账号被踢 */
  private onOut(event: any) {
    let res: any = {}
    const type = event.data.type
    switch (type) {
      case TIM.TYPES.KICKED_OUT_MULT_ACCOUNT:
        res.type = 1
        res.message = 'Web端，同一账号，多页面登录被踢'
        break
      case TIM.TYPES.KICKED_OUT_MULT_DEVICE:
        res.type = 2
        res.message = '同一账号，多端登录被踢'
        break
      case TIM.TYPES.KICKED_OUT_USERSIG_EXPIRED:
        res.type = 3
        res.message = '签名过期'
        break

      default:
        break
    }
    this.myEvent.emit('onOut', res)
  }

  /** 收到推送的单聊、群聊、群提示、群系统通知的新消息 数据处理&触发自定义事件 */
  private onMessageReceived({ data }: any) {
    // 只加载当前群消息
    let groupData = data.filter((i: { to: string }) => i.to === this.OWN.GROUP_ID)
    groupData.forEach(async (i: any) => {
      switch (i.type) {
        // 群系统通知消息
        case TIM.TYPES.MSG_GRP_SYS_NOTICE:
          if (i.payload && i.payload.userDefinedField) {
            // 点赞、拉流、商品、直播结束
            let obj = JSON.parse(i.payload.userDefinedField) || {}
            switch (obj.type) {
              case 1:
                // 拉流地址
                this.myEvent.emit('onOther', { pull: obj.msg })
                break
              case 2:
                // 点赞数、观看人数
                this.myEvent.emit('onOther', JSON.parse(obj.msg))
                break
              case 3:
                // 宝贝推送
                this.myEvent.emit('onOther', { goods: JSON.parse(obj.msg) })
                break
              case 4:
                // 直播结束
                this.myEvent.emit('onOther', { liveEnd: true })
                break

              default:
                break
            }
          }
          break
        // 群提示消息
        case TIM.TYPES.MSG_GRP_TIP:
          if (i.payload.operationType === TIM.TYPES.GRP_TIP_MBR_JOIN) {
            // 有成员加群
            this.myEvent.emit('onMessageReceived', {
              join: { nick: i.nick, avatar: i.avatar, userId: i.payload.operatorID, time: i.time },
            })
          } else if (i.payload.operationType === TIM.TYPES.GRP_TIP_MBR_PROFILE_UPDATED) {
            // console.log('有人被禁言', i)
          }
          break
        // 自定义消息
        case TIM.TYPES.MSG_CUSTOM:
          // console.log('自定义消息', i)
          break
        // 文本消息
        case TIM.TYPES.MSG_TEXT:
          // 如果登录状态 获取消息发送者的群成员信息
          let info: any = this.SDKReady && (await this.getGroupMemberProfile([i.from]))
          this.myEvent.emit('onMessageReceived', {
            msg: { userId: i.from, text: i.payload.text, time: i.time, nick: i.nick, avatar: i.avatar, role: info && info.role },
          })
          break

        default:
          break
      }
    })
  }

  //#endregion

  //#region 公共暴露方法

  /**
   * 登录
   *
   * @param {string} userId 用户标识
   * @param {string} userSig 标识签名
   * @returns {Promise<object>}
   * @memberof Tim
   */
  login(userId: string, userSig: string): Promise<object> {
    // 存储当前登录信息
    this.OWN.USER_ID = userId
    this.OWN.USER_SIG = userSig
    if (!userId || !userSig) {
      return Promise.reject({ code: -1, errorMsg: '参数不正确，请传递正确参数' })
    }
    // 登录IM
    return this.tim.login({ userID: userId, userSig })
  }
  /**
   * 加入群组/聊天室
   *
   * @param {string} groupId 群组ID
   * @param {string} [type='GRP_AVCHATROOM'] 群组类型
   * @returns {Promise<object>}
   * @memberof Tim
   */
  joinGroup(groupId: string, type: string = 'GRP_AVCHATROOM'): Promise<object> {
    // 存储信息
    this.OWN.GROUP_ID = groupId
    return this.tim.joinGroup({ groupID: groupId, type: TIM.TYPES[type] })
  }
  /**
   * 更新个人资料
   *
   * @param {string} nick 昵称
   * @param {string} [avatar=''] 头像
   * @param {string} [selfSignature=''] 个性签名
   * @returns {Promise<object>}
   * @memberof Tim
   */
  updateInfo(nick: string, avatar: string = '', selfSignature: string = ''): Promise<object> {
    return this.tim.updateMyProfile({ nick, avatar, selfSignature })
  }
  /**
   * 获取群成员信息
   *
   * @param {[string]} [userIdList=[this.OWN.USER_ID]]
   * @param {string} [groupId=this.OWN.GROUP_ID]
   * @returns
   * @memberof Tim
   */
  async getGroupMemberProfile(userIdList: [string] = [this.OWN.USER_ID], groupId: string = this.OWN.GROUP_ID): Promise<object> {
    // 即使只拉取一个群成员的资料，也需要用数组类型，例如：userIDList
    try {
      let info: object = {}
      let res = await this.tim.getGroupMemberProfile({ groupID: groupId, userIDList: userIdList })
      if (res && res.code === 0) {
        let member = (res.data && res.data.memberList && res.data.memberList[0]) || {}
        info = {
          role: member && member.role,
          muteUntil: member && member.muteUntil,
          nick: member && member.nick,
          userId: member && member.userID,
        }
      }
      return info
    } catch (error) {
      return { code: -1, message: '获取群成员信息失败' }
    }
  }

  /**
   * 发送消息
   *
   * @param {string} to 发送对象
   * @param {string} text 发送文本
   * @param {string} [conversationType='CONV_GROUP'] 会话类型 默认为音视频聊天室
   * @returns {Promise<object>}
   * @memberof Tim
   */
  async sendMessage(to: string, text: string, conversationType: string = 'CONV_GROUP'): Promise<object> {
    if (!this.SDKReady) {
      return Promise.reject({ code: -1, errorMsg: '请先登录' })
    }
    if (replaceSpace(text).length === 0) {
      return Promise.reject({ code: -1, errorMsg: '消息格式有误' })
    }
    try {
      // 创建消息文本
      const messageSamples = await this.tim.createTextMessage({ to, conversationType: TIM.TYPES[conversationType], payload: { text } })
      // 发送
      const res = await this.tim.sendMessage(messageSamples)
      if (res.code === 0) {
        const message = res.data.message
        // 获取自己的群信息 TM获取不到消息发送者的昵称
        const info: any = await this.getGroupMemberProfile()
        // 触发消息更新事件
        this.myEvent.emit('onMessageReceived', {
          msg: {
            userId: message.from,
            avatar: message.avatar,
            text: message.payload.text,
            time: message.time,
            nick: info.nick,
            role: info.role,
          },
        })
      }
      return res
    } catch (error) {
      return { code: -1, message: '发送失败' }
    }
  }

  /**
   * 重发消息
   *
   * @param {*} message 发送失败的消息实例
   * @returns {Promise<object>}
   * @memberof Tim
   */
  resendMessage(message: any): Promise<object> {
    return this.tim.resendMessage(message)
  }
  //#endregion
}

export default Tim
