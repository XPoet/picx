const timeHelper = {

  now: new Date(),

  getYYYYMMDD() {
    const yyyy = this.now.getFullYear()
    const mm = this.now.getMonth() + 1
    const dd = this.now.getDate()
    return `${yyyy}${mm < 10 ? '0' + mm : mm}${dd < 10 ? '0' + dd : dd}`
  },

}


export default timeHelper
