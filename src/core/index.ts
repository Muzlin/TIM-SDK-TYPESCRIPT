/*
 * @Author: lilin
 * @Date: 2020-04-25 17:56:27
 * @Last Modified by: lilin
 * @Last Modified time: 2020-05-13 16:35:15
 * @简介: SDK
 */

import TIM from 'tim-js-sdk'
import EventEmitter from './EventEmitter'
import { validationOptions, replaceSpace, getSdkAppId } from '../utils/index'
import { registerEvent } from './event'

// 默认配置
const defaultOptions = {
  SDKAppID: getSdkAppId(),
  logLevel: 3,
}

let tim: any = {}
let SDKReady = false // SDK状态
let myEvent = new EventEmitter() // 实例化自定义事件
let OWN = { GROUP_ID: '', USER_ID: '', NICK: '', ROLE: '', USER_SIG: '', MUTE: 0 } // 当前登录用户信息 MUTE 禁言时间
let isInit = false

interface options {
  SDKAppID: string
  logLevel?: number
}

const Tim = {
  /**
   * 初始化
   *
   * @param {*} options 配置参数 logLevel日志级别、SDKAppID
   * @param {*} hooks 监听钩子
   * @returns
   */
  async initSdk(hooks: object, options?: options ) {
    options = Object.assign(defaultOptions, options)
    validationOptions(options) // 参数验证
    // SDK实例
    if (!isInit) {
      tim = TIM.create(options)
      // 设置日志级别
      tim.setLogLevel(options.logLevel)
      // 初始监听事件
      tim.on(TIM.EVENT.SDK_READY, this.onReady, this) // 监听SDK加载完可以执行鉴权请求事件
      // tim.on(TIM.EVENT.CONVERSATION_LIST_UPDATED, this.onConversationListUpdated, this) // 监听会话列表更改事件
      tim.on(TIM.EVENT.MESSAGE_RECEIVED, this.onMessageReceived, this) // 监听收到群消息、通知等事件
      tim.on(TIM.EVENT.SDK_NOT_READY, this.notReady, this) // SDK NOT READY
      tim.on(TIM.EVENT.KICKED_OUT, this.onOut, this) // 签名过期、账号被踢
    }
    // 暴露自定义&TIM事件
    registerEvent(hooks, myEvent, tim, TIM)
    isInit = true
  },

  /**
   * SDK加载完成登录完成
   *
   */
  async onReady() {
    SDKReady = true
    myEvent.emit('onReady', OWN.USER_ID)
  },

  /**
   * SDK 进入 not ready 状态
   *
   */
  notReady() {
    SDKReady = false
    myEvent.emit('onNotReady')
  },

  /**
   * 签名过期、账号被踢
   *
   * @param {*} event
   */
  onOut(event: any) {
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
    myEvent.emit('onOut', res)
  },

  /**
   * 登录
   *
   * @param {string} userId 用户标识
   * @param {string} userSig 标识签名
   * @returns {Promise<object>}
   */
  login(userId: string, userSig: string): Promise<object> {
    // 存储当前登录信息
    OWN.USER_ID = userId
    OWN.USER_SIG = userSig
    if (!userId || !userSig) {
      return Promise.reject({ code: -1, errorMsg: '参数不正确，请传递正确参数' })
    }
    // 登录IM
    return tim.login({ userID: userId, userSig })
  },

  /**
   * 加入群组/聊天室
   * 正常加群，即登录加群。此时 SDK 内的所有接口都能正常调用。
   * 匿名加群，即不登录加群。此时只能收消息，其他任何需要鉴权的接口都不能调用
   *
   * @param {string} groupId 群组ID
   * @param {string} [type='GRP_AVCHATROOM'] 群组类型
   * @returns {Promise<object>}
   */
  joinGroup(groupId: string, type: string = 'GRP_AVCHATROOM'): Promise<object> {
    // 存储信息
    OWN.GROUP_ID = groupId
    return tim.joinGroup({ groupID: groupId, type: TIM.TYPES[type] })
  },

  /**
   * 更新个人资料
   *
   * @param {string} nick 昵称
   * @param {string} [avatar=''] 头像
   * @param {string} [selfSignature=''] 个性签名
   * @returns {Promise<object>}
   */
  updateInfo(nick: string, avatar: string = '', selfSignature: string = ''): Promise<object> {
    return tim.updateMyProfile({ nick, avatar, selfSignature })
  },

  /**
   * 获取群成员信息
   *
   * @param {[string]} [userIdList=[OWN.USER_ID]]
   * @param {string} [groupId=OWN.GROUP_ID]
   * @returns
   */
  async getGroupMemberProfile(userIdList: [string] = [OWN.USER_ID], groupId: string = OWN.GROUP_ID): Promise<object> {
    // 即使只拉取一个群成员的资料，也需要用数组类型，例如：userIDList
    try {
      let info: object = {}
      let res = await tim.getGroupMemberProfile({ groupID: groupId, userIDList: userIdList })
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
      return Promise.reject(error)
    }
  },

  /**
   * 发送消息
   *
   * @param {string} to 发送对象
   * @param {string} text 发送文本
   * @param {string} [conversationType='CONV_GROUP'] 会话类型 默认为音视频聊天室
   * @returns {Promise<object>}
   */
  async sendMessage(to: string, text: string, conversationType: string = 'CONV_GROUP'): Promise<object> {
    if (!SDKReady) {
      return Promise.reject({ code: -1, errorMsg: '请先登录' })
    }
    if (replaceSpace(text).length === 0) {
      return Promise.reject({ code: -1, errorMsg: '消息格式有误' })
    }
    try {
      // 创建消息文本
      const messageSamples = await tim.createTextMessage({ to, conversationType: TIM.TYPES[conversationType], payload: { text } })
      // 发送
      const res = await tim.sendMessage(messageSamples)
      if (res.code === 0) {
        const message = res.data.message
        // 获取自己的群信息 TM获取不到消息发送者的昵称
        const info: any = await this.getGroupMemberProfile()
        // 触发消息更新事件
        myEvent.emit('onMessageReceived', {
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
      return Promise.reject(error)
    }
  },

  /**
   * 收到推送的单聊、群聊、群提示、群系统通知的新消息
   * 数据处理&触发自定义事件
   *
   * @param {*} data
   */
  async onMessageReceived({ data }: any) {
    // 只加载当前群消息
    let groupData = data.filter((i: { to: string }) => i.to === OWN.GROUP_ID)
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
                myEvent.emit('onOther', { pull: obj.msg })
                break
              case 2:
                // 点赞数、观看人数
                myEvent.emit('onOther', JSON.parse(obj.msg))
                break
              case 3:
                // 宝贝推送
                myEvent.emit('onOther', { goods: JSON.parse(obj.msg) })
                break
              case 4:
                // 直播结束
                myEvent.emit('onOther', { liveEnd: true })
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
            myEvent.emit('onMessageReceived', { join: { nick: i.nick, avatar: i.avatar, userId: i.payload.operatorID, time: i.time } })
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
          let info = SDKReady && (await this.getGroupMemberProfile([i.from]))
          myEvent.emit('onMessageReceived', {
            msg: { userId: i.from, text: i.payload.text, time: i.time, nick: i.nick, avatar: i.avatar, role: info && info.role },
          })
          break

        default:
          break
      }
    })
  },

  /**
   * 会话列表更新
   * 自己发送的消息这里可以监听
   * @param {*} {data}
   */
  onConversationListUpdated({ data }: any) {
    data.forEach(i => {
      switch (i.type) {
        // GROUP（群组）会话
        case TIM.TYPES.CONV_GROUP:
          // console.log('GROUP（群组）会话', i)
          break
        // SYSTEM（系统）会话。该会话只能接收来自系统的通知消息，不能发送消息。
        case TIM.TYPES.CONV_SYSTEM:
          // console.log('SYSTEM（系统）会话。该会话只能接收来自系统的通知消息，不能发送消息。', i)
          break

        default:
          break
      }
    })
  },

  /**
   * 重发消息
   *
   * @param {*} message 发送失败的消息实例
   * @returns {Promise<object>}
   */
  resendMessage(message: any): Promise<object> {
    return tim.resendMessage(message)
  },
}

export default Tim
