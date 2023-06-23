import {getInput, setOutput, setFailed, info} from '@actions/core'
import {downloadTool, cacheFile, find} from '@actions/tool-cache'
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

    let path = find('apptainer', versionSpec)

    if (path !== '') {
      path = `${path}/apptainer.deb`
      info(`Using cached file: ${path}`)
    } else {
      info(`Dowloading ${url}`)
      path = await cacheFile(
        await downloadTool(url),
        'apptainer.deb',
        'apptainer',
        versionSpec
      )
      path = `${path}/apptainer.deb`
    }

    await exec('sudo', ['apt-get', 'install', '-y', '--no-recommends', path])
    setOutput('apptainer-version', versionSpec)
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}

run()
