import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as core from '../__fixtures__/core.js'
import type * as installer from '../src/installer.js'
import type * as cache from '@actions/cache'

const INSTALLER_COMMIT = 'a9325172651120164949df072e37b3238a7c00de'
const getRelease = jest.fn<typeof installer.getRelease>()
const install = jest.fn<typeof installer.install>()
const installedVersion = jest.fn<typeof installer.installedVersion>()
const configureAppArmor = jest.fn<() => Promise<void>>()
const restoreCache = jest.fn<typeof cache.restoreCache>()
const saveCache = jest.fn<typeof cache.saveCache>()
const isFeatureAvailable = jest.fn<typeof cache.isFeatureAvailable>()
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/cache', () => ({
  restoreCache,
  saveCache,
  isFeatureAvailable
}))
jest.unstable_mockModule('../src/installer.js', () => ({
  INSTALLER_COMMIT,
  getRelease,
  install,
  installedVersion
}))
jest.unstable_mockModule('../src/apparmor.js', () => ({ configureAppArmor }))
const { run } = await import('../src/main.js')

let temp: string
let dir: string
let key: string
const previous = process.env.RUNNER_TOOL_CACHE
const release = { tag_name: 'v1.5.5', assets: [] }

beforeEach(async () => {
  jest.resetAllMocks()
  temp = await mkdtemp(join(tmpdir(), 'apptainer-test-'))
  process.env.RUNNER_TOOL_CACHE = temp
  dir = join(temp, 'apptainer', '1.5.5', process.arch)
  const osVersion = /^VERSION_ID="?([0-9.]+)/m.exec(
    await readFile('/etc/os-release', 'utf8')
  )![1]
  key = `setup-apptainer-v1-${INSTALLER_COMMIT.slice(0, 12)}-ubuntu-${osVersion}-${process.arch}-1.5.5`
  core.getInput.mockImplementation(
    (name) =>
      ({
        'apptainer-version': '1.5.5',
        'github-token': 'test-token',
        cache: 'true'
      })[name] || ''
  )
  getRelease.mockResolvedValue(release)
  install.mockResolvedValue(undefined)
  installedVersion.mockResolvedValue('1.5.5')
  configureAppArmor.mockResolvedValue(undefined)
  isFeatureAvailable.mockReturnValue(true)
  restoreCache.mockResolvedValue(undefined)
  saveCache.mockResolvedValue(123)
})

afterEach(async () => {
  await rm(temp, { recursive: true, force: true })
  if (previous === undefined) delete process.env.RUNNER_TOOL_CACHE
  else process.env.RUNNER_TOOL_CACHE = previous
})

test('rejects ARM64 before accessing releases or caches', async () => {
  const original = Object.getOwnPropertyDescriptor(process, 'arch')!
  Object.defineProperty(process, 'arch', { value: 'arm64' })
  try {
    await run()
    expect(core.setFailed).toHaveBeenCalledWith(
      'Only x64 runners are supported; received arm64'
    )
    expect(getRelease).not.toHaveBeenCalled()
    expect(restoreCache).not.toHaveBeenCalled()
    expect(install).not.toHaveBeenCalled()
    expect(core.addPath).not.toHaveBeenCalled()
  } finally {
    Object.defineProperty(process, 'arch', original)
  }
})

test('installs and caches the entire directory on a miss', async () => {
  await run()
  expect(restoreCache).toHaveBeenCalledWith([dir], key)
  expect(install).toHaveBeenCalledWith(dir, '1.5.5', 'x86_64', release)
  expect(saveCache).toHaveBeenCalledWith([dir], key)
  expect(await readFile(join(dir, '.setup-apptainer-key'), 'utf8')).toBe(key)
  expect(core.addPath).toHaveBeenCalledWith(join(dir, 'bin'))
  expect(core.setOutput).toHaveBeenCalledWith('cache-hit', false)
  expect(core.setOutput).toHaveBeenCalledWith('apptainer-version', '1.5.5')
  expect(core.setFailed).not.toHaveBeenCalled()
})

test('restores a complete installation and skips release downloads and installation', async () => {
  restoreCache.mockImplementationOnce(async () => {
    await mkdir(dir, { recursive: true })
    return key
  })
  await run()
  expect(install).not.toHaveBeenCalled()
  expect(getRelease).not.toHaveBeenCalled()
  expect(saveCache).not.toHaveBeenCalled()
  expect(configureAppArmor).toHaveBeenCalledWith(dir, 'x86_64')
  expect(core.addPath).toHaveBeenCalledWith(join(dir, 'bin'))
  expect(core.setOutput).toHaveBeenCalledWith('cache-hit', true)
})

test('reuses an existing local installation', async () => {
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, '.setup-apptainer-key'), key)
  await run()
  expect(restoreCache).not.toHaveBeenCalled()
  expect(install).not.toHaveBeenCalled()
  expect(core.setOutput).toHaveBeenCalledWith('cache-hit', true)
})

test('reinstalls an incomplete cached directory', async () => {
  restoreCache.mockImplementationOnce(async () => {
    await mkdir(dir, { recursive: true })
    return key
  })
  installedVersion.mockResolvedValueOnce(undefined)
  await run()
  expect(install).toHaveBeenCalled()
  expect(core.warning).toHaveBeenCalledWith(
    expect.stringContaining('incomplete')
  )
  expect(core.setOutput).toHaveBeenCalledWith('cache-hit', false)
})

test.each(['latest', ''])(
  'resolves %p before selecting a version-specific cache',
  async (requested) => {
    core.getInput.mockImplementation((name) =>
      name === 'apptainer-version' ? requested : ''
    )
    await run()
    expect(getRelease).toHaveBeenCalledTimes(1)
    expect(getRelease).toHaveBeenCalledWith('latest', '')
    expect(restoreCache).toHaveBeenCalledWith([dir], key)
    expect(install).toHaveBeenCalledWith(dir, '1.5.5', 'x86_64', release)
  }
)

test('does not pin latest to an old cached version', async () => {
  core.getInput.mockImplementation((name) =>
    name === 'apptainer-version' ? 'latest' : ''
  )
  getRelease.mockResolvedValue({ tag_name: 'v1.5.6', assets: [] })
  installedVersion.mockResolvedValue('1.5.6')
  await run()
  expect(restoreCache.mock.calls[0][1]).toMatch(/-1\.5\.6$/)
  expect(core.setOutput).toHaveBeenCalledWith('apptainer-version', '1.5.6')
})

test.each(['restore', 'save'])(
  'cache %s failures do not fail installation',
  async (operation) => {
    if (operation === 'restore')
      restoreCache.mockRejectedValueOnce(new Error('offline'))
    else saveCache.mockRejectedValueOnce(new Error('already reserved'))
    await run()
    expect(core.warning).toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.addPath).toHaveBeenCalled()
  }
)

test('supports running outside GitHub Actions without a cache service', async () => {
  isFeatureAvailable.mockReturnValue(false)
  await run()
  expect(install).toHaveBeenCalled()
  expect(restoreCache).not.toHaveBeenCalled()
  expect(saveCache).not.toHaveBeenCalled()
})

test('can disable persistent caching', async () => {
  core.getInput.mockImplementation((name) =>
    name === 'cache' ? 'false' : '1.5.5'
  )
  await run()
  expect(restoreCache).not.toHaveBeenCalled()
  expect(saveCache).not.toHaveBeenCalled()
})

test('does not expose or cache a failed installation', async () => {
  install.mockRejectedValueOnce(new Error('download failed'))
  await run()
  expect(core.setFailed).toHaveBeenCalledWith('download failed')
  expect(core.addPath).not.toHaveBeenCalled()
  expect(core.setOutput).not.toHaveBeenCalled()
  expect(saveCache).not.toHaveBeenCalled()
})

test('rejects an incorrect installed version', async () => {
  installedVersion.mockResolvedValue('1.4.5')
  await run()
  expect(core.setFailed).toHaveBeenCalledWith(
    'Expected Apptainer 1.5.5, found 1.4.5'
  )
  expect(saveCache).not.toHaveBeenCalled()
})

test.each(['v1.5.5', '1.5', '1.5.*', '--allow-unauthenticated'])(
  'rejects invalid version %p',
  async (requested) => {
    core.getInput.mockReturnValue(requested)
    await run()
    expect(core.setFailed).toHaveBeenCalled()
    expect(restoreCache).not.toHaveBeenCalled()
    expect(install).not.toHaveBeenCalled()
  }
)
