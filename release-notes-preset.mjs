import createPreset from 'conventional-changelog-conventionalcommits'

// semantic-release 的 notes/analyze 插件按 preset 名解析时，会命中
// @commitlint/config-conventional 间接安装的 conventional-changelog-conventionalcommits@10，
// 其函数式模板与 @semantic-release/release-notes-generator 依赖的
// conventional-changelog-writer@8 不兼容（Release Notes 分组渲染为空）。
// 这里显式加载项目自有的 9.3.1（旧版字符串模板格式），并集中定义提交分组。
export default function createReleaseNotesPreset() {
  return createPreset({
    types: [
      { type: 'feat', section: '✨ Features' },
      { type: 'fix', section: '🐞 Bug Fixes' },
      { type: 'perf', section: '📈 Performance Improvements' },
      { type: 'ui', section: '💄 UI Improvements' },
      { type: 'revert', section: '⏪ Reverts' },
      { type: 'refactor', section: '🔨 Code Refactoring' },
      { type: 'docs', section: '📝 Documentation', hidden: true },
      { type: 'style', section: '🎨 Styles', hidden: true },
      { type: 'test', section: '✅ Tests', hidden: true },
      { type: 'build', section: '🛠️ Build System', hidden: true },
      { type: 'ci', section: '🔧 Continuous Integration', hidden: true },
      { type: 'chore', section: '📦 Chores', hidden: true },
    ],
  })
}
