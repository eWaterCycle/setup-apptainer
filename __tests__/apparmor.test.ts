import { beforeEach, expect, jest, test } from '@jest/globals'
import * as fs from 'node:fs/promises'
import * as exec from '../__fixtures__/exec.js'

const readFile = jest.fn<() => Promise<string>>()
const writeFile = jest.fn<typeof fs.writeFile>()
jest.unstable_mockModule('node:fs/promises', () => ({
  ...fs,
  readFile,
  writeFile
}))
jest.unstable_mockModule('@actions/exec', () => exec)
const { configureAppArmor } = await import('../src/apparmor.js')

beforeEach(() => {
  jest.resetAllMocks()
  exec.exec.mockResolvedValue(0)
  writeFile.mockResolvedValue(undefined)
})

test.each(['0\n', ''])(
  'skips AppArmor when the restriction is %p',
  async (setting) => {
    readFile.mockResolvedValue(setting)
    await configureAppArmor('/cache/apptainer', 'x86_64')
    expect(exec.exec).not.toHaveBeenCalled()
  }
)

test('skips systems without the AppArmor restriction', async () => {
  readFile.mockRejectedValue(
    Object.assign(new Error('missing'), { code: 'ENOENT' })
  )
  await configureAppArmor('/cache/apptainer', 'x86_64')
  expect(exec.exec).not.toHaveBeenCalled()
})

test('loads a profile for relocated binaries without disabling global restrictions', async () => {
  readFile.mockResolvedValue('1\n')
  await configureAppArmor('/cache/apptainer', 'x86_64')
  const profile = writeFile.mock.calls[0][1] as string
  expect(profile).toContain(
    '"/cache/apptainer/x86_64/{bin/apptainer,libexec/apptainer/libexec/starter{,-suid}}"'
  )
  expect(profile).toContain('userns,')
  expect(exec.exec.mock.calls).toEqual([
    [
      'sudo',
      [
        'install',
        '-m',
        '0644',
        expect.any(String),
        expect.stringMatching(/^\/etc\/apparmor.d\/setup-apptainer-/)
      ]
    ],
    [
      'sudo',
      [
        'apparmor_parser',
        '--replace',
        expect.stringMatching(/^\/etc\/apparmor.d\/setup-apptainer-/)
      ]
    ]
  ])
})

test('escapes special characters in attachment paths', async () => {
  readFile.mockResolvedValue('1')
  await configureAppArmor('/cache/a[1]*', 'x86_64')
  expect(writeFile.mock.calls[0][1]).toContain('/cache/a\\[1\\]\\*/x86_64/')
})

test('reports unexpected errors reading the restriction', async () => {
  readFile.mockRejectedValue(new Error('permission denied'))
  await expect(configureAppArmor('/cache', 'x86_64')).rejects.toThrow(
    'permission denied'
  )
})
