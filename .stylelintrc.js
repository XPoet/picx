module.exports = {
  extends: [
    'stylelint-config-rational-order', // CSS 属性顺序 stylelint 配置包
    'stylelint-stylus/standard' // Stylus stylelint 标准配置包
  ],
  rules: {
    'stylus/pythonic': 'never', // Stylus 保留尖括号({})
    'stylus/no-eol-whitespace': null
  }
}
