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

    const toolName = 'apptainer'
    const fname = 'apptainer.deb'
    let cacheDir = find(toolName, versionSpec)

    if (cacheDir !== '') {
      info(`Found cache: ${cacheDir}/`)
    } else {
      info(`Dowloading ${url}`)
      const pathToDeb = await downloadTool(url)
      info('Adding deb to cache')
      cacheDir = await cacheFile(pathToDeb, fname, toolName, versionSpec)
      info(`... ${cacheDir}`)
    }

    const pathToCachedDeb = `${cacheDir}/${fname}`
    await exec('sudo', ['apt-get', 'install', '-y', pathToCachedDeb])
    setOutput('apptainer-version', versionSpec)
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}

run()
