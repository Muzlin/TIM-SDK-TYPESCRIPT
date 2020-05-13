/*
 * @Author: lilin
 * @Date: 2020-04-25 17:57:37
 * @Last Modified by: lilin
 * @Last Modified time: 2020-05-13 14:56:55
 * @简介: 工具函数
 */

/**
 * 是否为对象
 *
 * @export
 * @param {*} data
 * @returns
 */
export function isObject(data: object) {
  return Object.prototype.toString.call(data) === '[object Object]'
}

/**
 * 是否为空对象
 *
 * @export
 * @param {*} data
 * @returns
 */
export function isNullObject(data: object) {
  return isObject(data) && Object.keys(data).length === 0
}

/**
 * options 参数验证
 *
 * @export
 * @param {*} options
 */
export function validationOptions(options: object) {
  if (!isObject(options)) { throw new Error('options must is Object') }
}

/**
 * 去除空格
 *
 * @export
 * @param {*} str
 * @param {*} position
 * @returns
 */
export function replaceSpace(str: string, position: string = 'all') {
  if (!position) {
    return (str || '').replace(/(^\s+)|(\s+$)/g, '')
  }
  switch (position) {
    case 'front':
      return (str || '').replace(/(^\s+)|(\s+$)/g, '')
    case 'after':
      return (str || '').replace(/(^\s+)|(\s+$)/g, '')
    case 'all':
      return (str || '').replace(/\s/g, '')
    default:
      return str
  }
}

/**
 * 根据当前环境获取appId
 * com环境 1400368773 cn环境 1400366792 info环境 1400362866
 *
 * @export
 */
export function getSdkAppId(): number {
  let sdkAppId = 1400362866
  const domain = window.location.host || ''
  const suffix = domain.split('.')
  suffix.includes('cn') && (sdkAppId = 1400366792)
  suffix.includes('info') && (sdkAppId = 1400362866)
  suffix.includes('com') && (sdkAppId = 1400368773)
  return sdkAppId
}
