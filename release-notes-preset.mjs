import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import createPreset from 'conventional-changelog-conventionalcommits'

export default function createReleaseNotesPreset() {
  const preset = createPreset({
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

  preset.parser.notesPattern = keywords =>
    new RegExp(`^[\\s|*]*(${keywords}):[ \\t]*(.*)`, 'i')

  return preset
}

export async function prepare(_pluginConfig, { cwd, nextRelease, logger }) {
  const version = nextRelease?.version
  if (typeof version !== 'string' || !version.trim()) {
    throw new Error('Missing nextRelease.version; package.json was not updated.')
  }

  const packagePath = resolve(cwd, 'package.json')
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))

  if (packageJson.version === version) {
    logger.log('package.json version is already %s', version)
    return
  }

  packageJson.version = version
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')
  logger.log('Updated package.json version to %s', version)
}
