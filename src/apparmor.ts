import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { exec } from '@actions/exec'

export async function configureAppArmor(
  installDir: string,
  rpmArch: string
): Promise<void> {
  let restricted: string
  try {
    restricted = await readFile(
      '/proc/sys/kernel/apparmor_restrict_unprivileged_userns',
      'utf8'
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
    throw error
  }
  if (restricted.trim() !== '1') return

  const name = `setup-apptainer-${createHash('sha256').update(installDir).digest('hex').slice(0, 16)}`
  const escaped = installDir.replace(/[\\"*?[\]{},]/g, '\\$&')
  const profile = `abi <abi/4.0>,
include <tunables/global>
profile ${name} "${escaped}/${rpmArch}/{bin/apptainer,libexec/apptainer/libexec/starter{,-suid}}" flags=(unconfined) {
  userns,
}
`
  const temp = await mkdtemp(
    join(process.env.RUNNER_TEMP || tmpdir(), 'apptainer-apparmor-')
  )
  try {
    const source = join(temp, 'profile')
    const target = `/etc/apparmor.d/${name}`
    await writeFile(source, profile)
    await exec('sudo', ['install', '-m', '0644', source, target])
    await exec('sudo', ['apparmor_parser', '--replace', target])
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}
