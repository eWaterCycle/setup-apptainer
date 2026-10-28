import { getInput, setOutput, setFailed, info } from '@actions/core'
import { exec, getExecOutput } from '@actions/exec'

export async function run(): Promise<void> {
  try {
    if (process.platform === 'win32') {
      throw new Error('Apptainer is not supported on Windows')
    } else if (process.platform === 'darwin') {
      throw new Error('Apptainer is not supported on MacOS')
    }

    const versionSpec = getInput('apptainer-version') || 'latest'
    if (versionSpec !== 'latest' && !/^\d+\.\d+\.\d+$/.test(versionSpec)) {
      throw new Error(
        'apptainer-version must be "latest" or a version like 1.5.5'
      )
    }

    info('Installing Apptainer from ppa:apptainer/ppa')
    await exec('sudo', ['add-apt-repository', '-y', 'ppa:apptainer/ppa'])
    await exec('sudo', ['apt-get', 'update'])
    // PPA versions include a packaging revision and Ubuntu codename.
    const pkg =
      versionSpec === 'latest' ? 'apptainer' : `apptainer=${versionSpec}-*`
    await exec('sudo', ['apt-get', 'install', '-y', pkg])
    const { stdout } = await getExecOutput('apptainer', ['--version'])
    const installedVersion = stdout.trim().replace(/^apptainer version /, '')
    setOutput('apptainer-version', installedVersion)
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}
