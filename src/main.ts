import {
  addPath,
  getInput,
  info,
  setFailed,
  setOutput,
  warning
} from '@actions/core'
import { isFeatureAvailable, restoreCache, saveCache } from '@actions/cache'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { configureAppArmor } from './apparmor.js'
import {
  getRelease,
  install,
  installedVersion,
  INSTALLER_COMMIT
} from './installer.js'

async function readOptional(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ''
    throw error
  }
}

export async function run(): Promise<void> {
  try {
    if (process.platform !== 'linux')
      throw new Error('Apptainer requires a Linux runner')
    if (process.arch !== 'x64')
      throw new Error(
        `Only x64 runners are supported; received ${process.arch}`
      )
    const rpmArch = 'x86_64'
    const requested = getInput('apptainer-version') || 'latest'
    if (requested !== 'latest' && !/^\d+\.\d+\.\d+$/.test(requested)) {
      throw new Error(
        'apptainer-version must be "latest" or a version like 1.5.5'
      )
    }
    const token = getInput('github-token')
    const release =
      requested === 'latest' ? await getRelease('latest', token) : undefined
    const version = release ? release.tag_name.replace(/^v/, '') : requested
    if (!/^\d+\.\d+\.\d+$/.test(version))
      throw new Error(`Unexpected Apptainer release version: ${version}`)
    const osRelease = await readFile('/etc/os-release', 'utf8')
    const ubuntuVersion = /^VERSION_ID="?([0-9.]+)"?$/m.exec(osRelease)?.[1]
    if (!/^ID="?ubuntu"?$/m.test(osRelease) || !ubuntuVersion)
      throw new Error('This action supports Ubuntu runners')
    const key = `setup-apptainer-v1-${INSTALLER_COMMIT.slice(0, 12)}-ubuntu-${ubuntuVersion}-${process.arch}-${version}`
    const installDir = join(
      process.env.RUNNER_TOOL_CACHE ||
        join(homedir(), '.cache', 'setup-apptainer'),
      'apptainer',
      version,
      process.arch
    )
    const marker = join(installDir, '.setup-apptainer-key')
    const useCache = getInput('cache') !== 'false' && isFeatureAvailable()
    let reused = (await readOptional(marker)) === key
    if (!reused && useCache) {
      try {
        reused = (await restoreCache([installDir], key)) === key
      } catch (error) {
        warning(`Could not restore Apptainer cache: ${String(error)}`)
      }
    }
    if (reused && (await installedVersion(installDir)) !== version) {
      warning('Cached Apptainer installation is incomplete; reinstalling')
      reused = false
    }
    if (!reused) {
      await rm(installDir, { recursive: true, force: true })
      await mkdir(installDir, { recursive: true })
      await install(
        installDir,
        version,
        rpmArch,
        release || (await getRelease(version, token))
      )
      const actual = await installedVersion(installDir)
      if (actual !== version)
        throw new Error(
          `Expected Apptainer ${version}, found ${actual || 'no working installation'}`
        )
    } else {
      info(`Reusing Apptainer ${version} from ${installDir}`)
    }
    // The profile is machine configuration, so it must also be applied on cache hits.
    await configureAppArmor(installDir, rpmArch)
    await writeFile(marker, key)
    addPath(join(installDir, 'bin'))
    setOutput('apptainer-version', version)
    setOutput('cache-hit', reused)
    if (!reused && useCache) {
      try {
        await saveCache([installDir], key)
      } catch (error) {
        warning(`Could not save Apptainer cache: ${String(error)}`)
      }
    }
  } catch (error) {
    setFailed(error instanceof Error ? error.message : String(error))
  }
}
