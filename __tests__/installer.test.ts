import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type * as tc from '@actions/tool-cache'
import * as exec from '../__fixtures__/exec.js'

const downloadTool = jest.fn<typeof tc.downloadTool>()
jest.unstable_mockModule('@actions/exec', () => exec)
jest.unstable_mockModule('@actions/tool-cache', () => ({ downloadTool }))
const { install, installedVersion, getRelease, INSTALLER_COMMIT } =
  await import('../src/installer.js')
const script = await readFile(
  new URL('../__fixtures__/install-unprivileged.sh', import.meta.url)
)
const fetchMock = jest.spyOn(globalThis, 'fetch')
let temp: string
const asset = {
  name: 'apptainer-1.5.4-1.x86_64.rpm',
  browser_download_url:
    'https://github.com/apptainer/apptainer/releases/download/v1.5.4/apptainer-1.5.4-1.x86_64.rpm'
}
const release = { tag_name: 'v1.5.4', assets: [asset] }

beforeEach(async () => {
  jest.resetAllMocks()
  temp = await mkdtemp(join(tmpdir(), 'installer-test-'))
  exec.exec.mockResolvedValue(0)
  downloadTool.mockImplementation(async (url, dest) => {
    if (!dest) throw new Error('Missing destination')
    await writeFile(
      dest,
      url.includes('install-unprivileged.sh') ? script : 'RPM'
    )
    return dest
  })
})
afterEach(async () => {
  await rm(temp, { recursive: true, force: true })
})

test('uses pinned, verified installer and preserves the GitHub RPM filename', async () => {
  await install(temp, '1.5.4', 'x86_64', release)
  expect(downloadTool.mock.calls[0][0]).toContain(INSTALLER_COMMIT)
  expect(downloadTool.mock.calls[1]).toEqual([
    asset.browser_download_url,
    expect.stringMatching(/apptainer-1\.5\.4-1\.x86_64\.rpm$/)
  ])
  expect(exec.exec).toHaveBeenLastCalledWith('bash', [
    expect.stringMatching(/install-unprivileged\.sh$/),
    '-e',
    '-v',
    expect.stringMatching(/apptainer-1\.5\.4-1\.x86_64\.rpm$/),
    temp
  ])
  expect(exec.exec.mock.calls.some(([command]) => command === 'sudo')).toBe(
    false
  )
})

test('installs missing extraction prerequisites', async () => {
  exec.exec.mockResolvedValueOnce(1)
  await install(temp, '1.5.4', 'x86_64', release)
  expect(exec.exec).toHaveBeenCalledWith('sudo', ['apt-get', 'update'])
  expect(exec.exec).toHaveBeenCalledWith(
    'sudo',
    expect.arrayContaining(['rpm2cpio', 'cpio'])
  )
})

test('rejects a changed installer before executing it', async () => {
  downloadTool.mockImplementationOnce(async (_url, dest) => {
    await writeFile(dest!, 'tampered')
    return dest!
  })
  await expect(install(temp, '1.5.4', 'x86_64', release)).rejects.toThrow(
    'checksum mismatch'
  )
  expect(downloadTool).toHaveBeenCalledTimes(1)
  expect(exec.exec).toHaveBeenCalledTimes(1)
})

test('does not select an EL10 RPM when no portable RPM is available', async () => {
  await expect(
    install(temp, '1.5.4', 'x86_64', {
      tag_name: 'v1.5.4',
      assets: [{ ...asset, name: 'apptainer-1.5.4-1.el10.x86_64.rpm' }]
    })
  ).rejects.toThrow('no portable x86_64 RPM')
  expect(downloadTool).not.toHaveBeenCalled()
})

test('reports missing aarch64 assets instead of installing an x64 RPM', async () => {
  await expect(install(temp, '1.5.4', 'aarch64', release)).rejects.toThrow(
    'no portable aarch64 RPM release asset'
  )
  expect(downloadTool).not.toHaveBeenCalled()
})

test.each(['1.5.4', '1.5.4-1', '1.5.4-1.el8'])(
  'recognizes upstream version in %s',
  async (version) => {
    exec.getExecOutput.mockResolvedValue({
      exitCode: 0,
      stdout: `apptainer version ${version}\n`,
      stderr: ''
    })
    expect(await installedVersion(temp)).toBe('1.5.4')
  }
)

test('rejects a broken binary', async () => {
  exec.getExecOutput.mockResolvedValue({
    exitCode: 1,
    stdout: '',
    stderr: 'missing library'
  })
  expect(await installedVersion(temp)).toBeUndefined()
  exec.getExecOutput.mockRejectedValue(new Error('ENOENT'))
  expect(await installedVersion(temp)).toBeUndefined()
})

test('resolves latest using the GitHub token', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(release)))
  expect(await getRelease('latest', 'test-token')).toEqual(release)
  expect(fetchMock).toHaveBeenCalledWith(
    'https://api.github.com/repos/apptainer/apptainer/releases/latest',
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-token' })
    })
  )
})

test('requests exact tags without sending an empty token', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(release)))
  await getRelease('1.5.4', '')
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/tags/v1.5.4'),
    expect.objectContaining({
      headers: expect.not.objectContaining({ Authorization: expect.anything() })
    })
  )
})

test('reports missing releases clearly', async () => {
  fetchMock.mockResolvedValue(new Response('', { status: 404 }))
  await expect(getRelease('1.5.4', '')).rejects.toThrow(
    'GitHub returned HTTP 404'
  )
})
