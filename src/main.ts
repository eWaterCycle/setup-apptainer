import {getInput, setOutput, setFailed, info} from '@actions/core'
import {downloadTool} from '@actions/tool-cache'
import {exec} from '@actions/exec'

async function run(): Promise<void> {
  try {
    if (process.platform === 'win32') {
      throw new Error('Apptainer is not supported on Windows')
    } else if (process.platform === 'darwin') {
      throw new Error('Apptainer is not supported on MacOS')
    }

    const versionSpec: string = getInput('apptainer-version')
    const url = `https://github.com/apptainer/apptainer/releases/download/v${versionSpec}/apptainer_${versionSpec}_amd64.deb`

    info(`Dowloading ${url}`)
    const path = await downloadTool(url)

    // TODO cache .deb file
    await exec('sudo', ['apt', 'update'])
    await exec('sudo', ['apt', 'install', 'gdebi'])
    await exec('sudo', ['gdebi', '--non-interactive', path])

    setOutput('apptainer-version', versionSpec)
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}

run()
