const timeHelper = {

  now: Date.now(),

  zerofill(n) {
    return n < 10 ? '0' + n : n
  },

  getYYYYMMDD(now = this.now) {
    now = new Date(now)
    const yyyy = now.getFullYear()
    const MM = now.getMonth() + 1
    const DD = now.getDate()
    return `${yyyy}${this.zerofill(MM)}${this.zerofill(DD)}`
  },

  formatTimestamp(now = this.now) {
    now = new Date(now)
    let YYYY = now.getFullYear()
    let MM = now.getMonth() + 1
    let DD = now.getDate()
    let hh = now.getHours()
    let mm = now.getMinutes()
    let ss = now.getSeconds()
    return `${YYYY}-${this.zerofill(MM)}-${this.zerofill(DD)} ${this.zerofill(hh)}:${this.zerofill(mm)}:${this.zerofill(ss)}`
  }

}

export default timeHelper
