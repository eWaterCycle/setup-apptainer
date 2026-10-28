import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { exec, getExecOutput } from '@actions/exec'
import { downloadTool } from '@actions/tool-cache'

// Use the same unmodified installer for every requested version.
export const INSTALLER_COMMIT = 'a9325172651120164949df072e37b3238a7c00de'
const INSTALLER_SHA256 =
  'a097956eafa6ab3dd843ee429d0b774ed029753bfadf013b8046556228fac6f2'

export interface Release {
  tag_name: string
  assets: { name: string; browser_download_url: string }[]
}

export async function getRelease(
  version: string,
  token: string
): Promise<Release> {
  const endpoint = version === 'latest' ? 'latest' : `tags/v${version}`
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'eWaterCycle/setup-apptainer'
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(
    `https://api.github.com/repos/apptainer/apptainer/releases/${endpoint}`,
    { headers, signal: AbortSignal.timeout(30000) }
  )
  if (!response.ok) {
    throw new Error(
      `Could not resolve Apptainer ${version}: GitHub returned HTTP ${response.status}`
    )
  }
  return (await response.json()) as Release
}

export async function installedVersion(
  installDir: string
): Promise<string | undefined> {
  try {
    const result = await getExecOutput(
      join(installDir, 'bin', 'apptainer'),
      ['--version'],
      {
        silent: true,
        ignoreReturnCode: true
      }
    )
    if (result.exitCode !== 0) return undefined
    return /^apptainer version (\d+\.\d+\.\d+)(?:[-+][^\s]+)?\s*$/.exec(
      result.stdout
    )?.[1]
  } catch {
    return undefined
  }
}

export async function install(
  installDir: string,
  version: string,
  rpmArch: string,
  release: Release
): Promise<void> {
  // Generic release RPMs target older systems; EL10 builds require newer libc.
  const pattern = new RegExp(
    `^apptainer-${version.replace(/\./g, '\\.')}-[0-9]+\\.${rpmArch}\\.rpm$`
  )
  const asset = release.assets.find((candidate) => pattern.test(candidate.name))
  if (!asset)
    throw new Error(
      `Apptainer ${version} has no portable ${rpmArch} RPM release asset`
    )
  const ready = await exec(
    'bash',
    ['-c', 'command -v curl && command -v rpm2cpio && command -v cpio'],
    {
      silent: true,
      ignoreReturnCode: true
    }
  )
  if (ready !== 0) {
    await exec('sudo', ['apt-get', 'update'])
    await exec('sudo', [
      'apt-get',
      'install',
      '-y',
      '--no-install-recommends',
      'ca-certificates',
      'curl',
      'rpm2cpio',
      'cpio'
    ])
  }
  const temp = await mkdtemp(
    join(process.env.RUNNER_TEMP || tmpdir(), 'setup-apptainer-')
  )
  try {
    const installer = await downloadTool(
      `https://raw.githubusercontent.com/apptainer/apptainer/${INSTALLER_COMMIT}/tools/install-unprivileged.sh`,
      join(temp, 'install-unprivileged.sh')
    )
    const digest = createHash('sha256')
      .update(await readFile(installer))
      .digest('hex')
    if (digest !== INSTALLER_SHA256)
      throw new Error('Apptainer installer checksum mismatch')
    // Preserve the RPM filename: the upstream installer uses it to infer its distribution.
    const rpm = await downloadTool(
      asset.browser_download_url,
      join(temp, asset.name)
    )
    await exec('bash', [installer, '-e', '-v', rpm, installDir])
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}
