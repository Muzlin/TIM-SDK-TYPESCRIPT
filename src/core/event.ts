/*
 * @Author: lilin
 * @Date: 2020-04-25 17:55:52
 * @Last Modified by: lilin
 * @Last Modified time: 2020-05-12 16:22:39
 * @简介: 自定义事件注册
 */

import { isObject } from '../utils/index'

/**
 * 注册自定义事件
 *
 * @export
 * @param {*} hooks
 * @param {*} myEvent
 * @param {*} tim
 */

export function registerEvent(hooks: object, myEvent: any, tim: any, TIM: any) {
  if (isObject(hooks)) {
    // 清除事件
    myEvent.clear()
    let hooksKey = Object.keys(hooks)
    hooksKey.forEach(key => {
      switch (key) {
        case 'onReady':
          myEvent.on('onReady', hooks[key]) // 自定义事件 onRead 返回用户的基本信息
          break
        case 'onMessageReceived':
          myEvent.on('onMessageReceived', hooks[key]) // 自定义事件 群消息更新 包含了会话列表更新 返回处理后的业务数据
          break
        case 'onOther':
          myEvent.on('onOther', hooks[key]) // 自定义事件 其他事件包含推送：点赞 like、拉流地址 pull、商品包 goods
          break
        case 'onError':
          tim.on(TIM.EVENT.ERROR, hooks[key]) // TIM SDK出错事件
          break
        case 'onNetStateChange':
          tim.on(TIM.EVENT.NET_STATE_CHANGE, hooks[key]) // TIM 网络状态发生改变事件
          break
        case 'onNotReady':
          myEvent.on('onNotReady', hooks[key]) // 自定义事件 SDK NOT READY
          break
        case 'onOut':
          myEvent.on('onOut', hooks[key]) // 自定义事件 签名过期、账号被踢
          break

        default:
          break
      }
    })
  }
}
