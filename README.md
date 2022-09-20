<p align="center">
  <a href="https://github.com/ewatercycle/setup-apptainer/actions"><img alt="typescript-action status" src="https://github.com/ewatercycle/setup-apptainer/workflows/build-test/badge.svg"></a>
</p>

# GitHub Action to setup apptainer

To use [apptainer](https://apptainer.org/) containers in a workflow you need to install it first. This GitHub Action downloads, compiles and installs it for you.

The setup will add the apptainer executable to the PATH env var so it can be called in later steps.

## Inputs

### `apptainer-version`

Version of apptainer. See [releases page](https://github.com/apptainer/apptainer/releases) for available versions.
Version string should start with major version, not with `v` character.

## Example usage

```yaml
steps:
- uses: actions/checkout@v2
- uses: eWaterCycle/setup-apptainer@v1
  with:
    apptainer-version: 1.0.3
- name: Run an apptainer container
  run: apptainer run docker://alpine cat /etc/os-release
```

## Build

For developers of setup-apptainer action.

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

Install the dependencies  
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```

## Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder. 

Then run [ncc](https://github.com/zeit/ncc) and push the results:
```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket: 

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validate

You can now validate the action by referencing `./` in a workflow in your repo (see [test.yml](.github/workflows/test.yml))

```yaml
uses: ./
with:
  apptainer-version: 1.0.3
```

See the [actions tab](https://github.com/ewatercycle/setup-apptainer/actions) for runs of this action! :rocket:

## Usage:

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and latest V1 action
