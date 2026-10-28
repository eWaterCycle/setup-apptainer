[![Continuous Integration](https://github.com/eWaterCycle/setup-apptainer/actions/workflows/ci.yml/badge.svg)](https://github.com/eWaterCycle/setup-apptainer/actions/workflows/ci.yml)
![Coverage](badges/coverage.svg)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.7097122.svg)](https://doi.org/10.5281/zenodo.7097122)

This action enables you to easily use apptainer images in your GitHub action
workflows.

# GitHub Action to setup apptainer

To use [apptainer](https://apptainer.org/) containers in a workflow you need to
install it first. This GitHub Action installs it from the official
[Apptainer Ubuntu PPA](https://apptainer.org/docs/admin/latest/installation.html#install-ubuntu-packages),
using packages built for the runner's Ubuntu release. Ubuntu runners must have
`sudo` and `add-apt-repository` available, as GitHub-hosted Ubuntu runners do.

The setup will add the apptainer executable to the PATH env var so it can be
called in later steps.

## Inputs

### `apptainer-version`

Version of apptainer, defaulting to `latest`. An explicit version such as
`1.5.5` must be available in the PPA for the runner's Ubuntu release. The PPA
generally only retains the latest version, so older versions previously
installed from GitHub releases may no longer be available. Version strings must
not start with `v`.

## Outputs

### `apptainer-version`

The installed Apptainer version.

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

If you want to contribute to the development of apptainer-setup action, have a
look at the [contribution guidelines](CONTRIBUTING.md).
