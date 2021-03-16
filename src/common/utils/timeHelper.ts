export default class TimeHelper {

  private static zerofill(n: number) {
    return n < 10 ? '0' + n : n
  }

  static getYyyyMmDd(now: number = Date.now()) {
    const _now: Date = new Date(now)
    const yyyy = _now.getFullYear()
    const MM = _now.getMonth() + 1
    const DD = _now.getDate()
    return `${yyyy}${this.zerofill(MM)}${this.zerofill(DD)}`
  }

  static formatTimestamp(now: number = Date.now()) {
    const _now: Date = new Date(now)
    let YYYY = _now.getFullYear()
    let MM = _now.getMonth() + 1
    let DD = _now.getDate()
    let hh = _now.getHours()
    let mm = _now.getMinutes()
    let ss = _now.getSeconds()
    return `${YYYY}-${this.zerofill(MM)}-${this.zerofill(DD)} ${this.zerofill(hh)}:${this.zerofill(mm)}:${this.zerofill(ss)}`
  }
}
