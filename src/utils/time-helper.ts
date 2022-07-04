export default class TimeHelper {
  private static zerofill(n: number) {
    return n < 10 ? `0${n}` : n
  }

  static getYyyyMmDd(now: number = Date.now()) {
    const date: Date = new Date(now)
    const yyyy = date.getFullYear()
    const MM = date.getMonth() + 1
    const DD = date.getDate()
    return `${yyyy}${this.zerofill(MM)}${this.zerofill(DD)}`
  }

  static formatTimestamp(now: number = Date.now()) {
    const date: Date = new Date(now)
    const YYYY = date.getFullYear()
    const MM = date.getMonth() + 1
    const DD = date.getDate()
    const hh = date.getHours()
    const mm = date.getMinutes()
    const ss = date.getSeconds()
    return `${YYYY}-${this.zerofill(MM)}-${this.zerofill(DD)} ${this.zerofill(
      hh
    )}:${this.zerofill(mm)}:${this.zerofill(ss)}`
  }
}
