/*
 * @Author: lilin
 * @Date: 2020-04-25 17:55:17
 * @Last Modified by: lilin
 * @Last Modified time: 2020-05-12 17:14:17
 * @简介: 自定义事件类
 */

/**
 * 事件类
 *
 * @class EventEmitter
 */
class EventEmitter {
  private _events: object
  constructor() {}
  on(event: string, callback: () => any) {
    let callbacks = this._events[event] || []
    callbacks.push(callback)
    this._events[event] = callbacks
    return this
  }
  off(event: string, callback: () => any) {
    let callbacks = this._events[event]
    this._events[event] = callbacks && callbacks.filter((fn: () => any) => fn !== callback)
    return this
  }
  emit(...args: [string, any?]) {
    const event = args[0]
    const params = [].slice.call(args, 1)
    const callbacks = this._events[event]
    callbacks && callbacks.forEach((fn: any) => fn.apply(this, params))
    return this
  }
  once(event: string, callback: () => any) {
    let wrapFunc = (...args: any[]) => {
      callback.apply(this, args)
      this.off(event, wrapFunc)
    }
    this.on(event, wrapFunc)
    return this
  }
  // 清除事件
  clear() {
    this._events = {}
  }
}

export default EventEmitter
