function zerofill(n: number) {
  return n < 10 ? '0' + n : n
}

const TimeHelper = {

  getYyyyMmDd(now: number = Date.now()) {
    const _now: Date = new Date(now)
    const yyyy = _now.getFullYear()
    const MM = _now.getMonth() + 1
    const DD = _now.getDate()
    return `${yyyy}${zerofill(MM)}${zerofill(DD)}`
  },

  formatTimestamp(now: number = Date.now()) {
    const _now: Date = new Date(now)
    let YYYY = _now.getFullYear()
    let MM = _now.getMonth() + 1
    let DD = _now.getDate()
    let hh = _now.getHours()
    let mm = _now.getMinutes()
    let ss = _now.getSeconds()
    return `${YYYY}-${zerofill(MM)}-${zerofill(DD)} ${zerofill(hh)}:${zerofill(mm)}:${zerofill(ss)}`
  }

}

export default TimeHelper

/*export default class TimeHelper {

  private static now: number = Date.now()

  private static zerofill(n: number) {
    return n < 10 ? '0' + n : n
  }

  static getYyyyMmDd(now: number = this.now) {
    const _now: Date = new Date(now)
    const yyyy = _now.getFullYear()
    const MM = _now.getMonth() + 1
    const DD = _now.getDate()
    return `${yyyy}${TimeHelper.zerofill(MM)}${TimeHelper.zerofill(DD)}`
  }

  static formatTimestamp(now: number = TimeHelper.now) {
    const _now: Date = new Date(now)
    let YYYY = _now.getFullYear()
    let MM = _now.getMonth() + 1
    let DD = _now.getDate()
    let hh = _now.getHours()
    let mm = _now.getMinutes()
    let ss = _now.getSeconds()
    return `${YYYY}-${TimeHelper.zerofill(MM)}-${TimeHelper.zerofill(DD)} ${TimeHelper.zerofill(hh)}:${TimeHelper.zerofill(mm)}:${TimeHelper.zerofill(ss)}`
  }
}*/
