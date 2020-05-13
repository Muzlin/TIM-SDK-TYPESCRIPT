# 腾讯 IM 即时通讯 SDK

## how to user

```
onMessageReceived 返回参数说明
{
  // 收到消息
  msg: {
    userId: '用户ID',
    text: '消息',
    time: '时间',
    nick: '昵称',
    avatar: '头像',
    role: '角色' 未登录获取不到
  },
  // 新人入群
  join: {
    nick: '昵称',
    userId: '用户ID',
    avatar: '头像',
    time: '时间'
  }
}
```

```
onOther 返回参数说明
{
  pull: '拉流地址',
  memberNum: '观看人数',
  thumbsUpCount: '点赞数量',
  // 宝贝推送
  goods: {
    displayType: "0" // 显示方式 0：列表 1：弹窗
    pushDisplay: "1" // 推送显示 0：取消推送显示 1：推送显示
    resourceId: "100" // 资源ID
    resourceType: "0" // 资源类型（0:药品包)
    saleResourceId: 75 // 推销资源ID
    showsId: 67 // 直播场次ID
    sort: 1588758988230 // 推送排序
  },
  liveEnd: true
}
```

```javascript
// 对象方法
import Tim from '@ywkj/tim'

async init() {
  let options = {
    // SDKAppID: '1111', // 非必传 如果你传了 实例化的时候就用你传入的
    logLevel: 3, // 日志级别
  }
  // SDK初始化
  await Tim.initSdk({
    onReady: this.onReady, // 登录成功后事件
    onMessageReceived: this.onMessageReceived, // 群消息事件
    onOther: () => {},  // 其他事件推送包含：点赞 like、拉流地址 pull、商品包 goods
    onError: () => {}, // SDK出错
    onNetStateChange: () =>{}, // 网络状态改变
    onNotReady: () => {}, // SDK NOT READY 需要重新登录
    onOut: () => {} // 签名过期、账号被踢 {type: number, message: string} type==> 1:Web端，同一账号，多页面登录被踢 2:同一账号，多端登录被踢 3:签名过期
  }, options )


  // 登录
  Tim.login(userId, userSig)

  // 更新个人资料
  Tim.updateInfo(nick, avatar = '', selfSignature = '') // nick: 昵称 avatar: 头像 selfSignature: 个性签名

  // 加入群
  Tim.joinGroup(groupId)

  // 登录成功 SKD ready 事件
  onReady(data) {
    // return USER_ID
  },

  // 获取自身群资料 角色、禁言时间等
  Tim.getGroupMemberProfile()

  // 收到群消息事件
  onMessageReceived(data) {
    // this.noticeList.push(data)
  },

  // 会话发送
  Tim.sendMessage(groupId, message)
},

```

```javascript
// 引入类使用方式
import { ClassTim } from '@ywkj/tim'
let options = {
    // SDKAppID: '1111', // 非必传 如果你传了 实例化的时候就用你传入的
    logLevel: 3, // 日志级别
  }
let Tim = new ClassTim(
  {
    onReady: this.onReady, // 登录成功后事件
    onMessageReceived: this.onMessageReceived, // 群消息事件
    onOther: () => {}, // 其他事件推送包含：点赞 like、拉流地址 pull、商品包 goods
    onError: () => {}, // SDK出错
    onNetStateChange: () => {}, // 网络状态改变
    onNotReady: () => {}, // SDK NOT READY 需要重新登录
    onOut: () => {}, // 签名过期、账号被踢 {type: number, message: string} type==> 1:Web端，同一账号，多页面登录被踢 2:同一账号，多端登录被踢 3:签名过期
  },{options}
)
 // 登录
  Tim.login(userId, userSig)

  // 更新个人资料
  Tim.updateInfo(nick, avatar = '', selfSignature = '') // nick: 昵称 avatar: 头像 selfSignature: 个性签名

  // 加入群
  Tim.joinGroup(groupId)

  // 登录成功 SKD ready 事件
  onReady(data) {
    // return USER_ID
  },

  // 获取自身群资料 角色、禁言时间等
  Tim.getGroupMemberProfile()

  // 收到群消息事件
  onMessageReceived(data) {
    // this.noticeList.push(data)
  },

  // 会话发送
  Tim.sendMessage(groupId, message)
```
