import {beforeEach, expect, jest, test} from '@jest/globals'
import {getInput, setOutput, setFailed} from '@actions/core'
import {exec, getExecOutput} from '@actions/exec'
import {run} from '../src/main'

jest.mock('@actions/core')
jest.mock('@actions/exec')

const mockInput = jest.mocked(getInput)
const mockExec = jest.mocked(exec)
const mockExecOutput = jest.mocked(getExecOutput)

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
  async input => {
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
  async input => {
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
  Object.defineProperty(process, 'platform', {value: platform})
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
