import { beforeEach, expect, jest, test } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as exec from '../__fixtures__/exec.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => exec)

const { run } = await import('../src/main.js')
const { setOutput, setFailed } = core
const mockInput = core.getInput
const mockExec = exec.exec
const mockExecOutput = exec.getExecOutput

beforeEach(() => {
  jest.resetAllMocks()
  mockExec.mockResolvedValue(0)
  mockExecOutput.mockResolvedValue({
    exitCode: 0,
    stdout: 'apptainer version 1.5.5\n',
    stderr: ''
  })
})

test.each(['latest', ''])(
  'installs the latest PPA package for %p',
  async (input) => {
    mockInput.mockReturnValue(input)

    await run()

    expect(mockExec.mock.calls).toEqual([
      ['sudo', ['add-apt-repository', '-y', 'ppa:apptainer/ppa']],
      ['sudo', ['apt-get', 'update']],
      ['sudo', ['apt-get', 'install', '-y', 'apptainer']]
    ])
    expect(mockExecOutput).toHaveBeenCalledWith('apptainer', ['--version'])
    expect(setOutput).toHaveBeenCalledWith('apptainer-version', '1.5.5')
    expect(setFailed).not.toHaveBeenCalled()
  }
)

test('selects the requested upstream version with its PPA revision', async () => {
  mockInput.mockReturnValue('1.5.5')

  await run()

  expect(mockExec).toHaveBeenLastCalledWith('sudo', [
    'apt-get',
    'install',
    '-y',
    'apptainer=1.5.5-*'
  ])
  expect(setOutput).toHaveBeenCalledWith('apptainer-version', '1.5.5')
})

test('reports an unavailable version without claiming a successful install', async () => {
  mockInput.mockReturnValue('1.3.6')
  mockExec.mockResolvedValueOnce(0).mockResolvedValueOnce(0)
  mockExec.mockRejectedValueOnce(new Error('Version was not found'))

  await run()

  expect(setFailed).toHaveBeenCalledWith('Version was not found')
  expect(mockExecOutput).not.toHaveBeenCalled()
  expect(setOutput).not.toHaveBeenCalled()
})

test.each(['v1.5.5', '1.5', '1.5.*', '--allow-unauthenticated'])(
  'rejects invalid version %p before changing repositories',
  async (input) => {
    mockInput.mockReturnValue(input)

    await run()

    expect(setFailed).toHaveBeenCalledWith(
      'apptainer-version must be "latest" or a version like 1.5.5'
    )
    expect(mockExec).not.toHaveBeenCalled()
  }
)

test.each([
  ['win32', 'Windows'],
  ['darwin', 'MacOS']
])('rejects unsupported platform %s', async (platform, name) => {
  const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!
  Object.defineProperty(process, 'platform', { value: platform })
  try {
    await run()
    expect(setFailed).toHaveBeenCalledWith(
      `Apptainer is not supported on ${name}`
    )
    expect(mockExec).not.toHaveBeenCalled()
  } finally {
    Object.defineProperty(process, 'platform', originalPlatform)
  }
})
