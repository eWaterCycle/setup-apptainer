[![Continuous Integration](https://github.com/eWaterCycle/setup-apptainer/actions/workflows/ci.yml/badge.svg)](https://github.com/eWaterCycle/setup-apptainer/actions/workflows/ci.yml)
![Coverage](badges/coverage.svg)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.7097122.svg)](https://doi.org/10.5281/zenodo.7097122)

# GitHub Action to setup apptainer

Install [Apptainer](https://apptainer.org/) in your GitHub Actions workflows on
Ubuntu 22.04, 24.04, or 26.04 (x64) using
[apptainers unprivileged install script](https://apptainer.org/docs/admin/1.5/installation.html#install-unprivileged-from-pre-built-binaries).
The action adds `apptainer` to `PATH` and caches the installation for faster
subsequent runs.

Requires `sudo`, which is available on GitHub-hosted Ubuntu runners.

## Inputs

### `apptainer-version`

Apptainer version, such as `1.5.4`, without a leading `v`. Defaults to `latest`,
which selects the latest stable release on each run. Versions 1.1.4 and newer
are supported when a release provides prebuilt x64 binaries.

### `cache`

Cache the installation across workflow runs. Defaults to `true`; set to `false`
to disable. No additional `actions/cache` step is needed.

### `github-token`

Token used to look up releases. Defaults to `${{ github.token }}`.

## Outputs

### `apptainer-version`

The installed Apptainer version.

### `cache-hit`

`true` when an existing installation was reused; otherwise `false`.

## Example usage

```yaml
steps:
  - uses: actions/checkout@v7
  - uses: eWaterCycle/setup-apptainer@v3
    with:
      apptainer-version: latest
  - name: Run an apptainer container
    run: apptainer run docker://alpine cat /etc/os-release
```

## Contributing

See the [contribution guidelines](CONTRIBUTING.md).
