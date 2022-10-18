<a href="https://github.com/ewatercycle/setup-apptainer/actions"><img alt="typescript-action status" src="https://github.com/ewatercycle/setup-apptainer/workflows/build-test/badge.svg"></a>
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.7097122.svg)](https://doi.org/10.5281/zenodo.7097122)

This action enables you to easily use apptainer images in your GitHub action workflows.

# GitHub Action to setup apptainer

To use [apptainer](https://apptainer.org/) containers in a workflow you need to install it first. This GitHub Action downloads and installs it for you.

The setup will add the apptainer executable to the PATH env var so it can be called in later steps.

## Inputs

### `apptainer-version`

Version of apptainer. See [releases page](https://github.com/apptainer/apptainer/releases) for available versions.
Version string should start with major version, not with `v` character.

## Example usage

```yaml
steps:
- uses: actions/checkout@v2
- uses: eWaterCycle/setup-apptainer@v2
  with:
    apptainer-version: 1.1.2
- name: Run an apptainer container
  run: apptainer run docker://alpine cat /etc/os-release
```

## Contributing

If you want to contribute to the development of apptainer-setup action,
have a look at the [contribution guidelines](CONTRIBUTING.md).
