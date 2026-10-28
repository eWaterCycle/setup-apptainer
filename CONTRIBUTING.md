# Contributing guidelines

Questions, bug reports, documentation improvements, and code contributions are
welcome. Please follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Questions

Search the
[existing issues](https://github.com/eWaterCycle/setup-apptainer/issues) before
opening a new issue. Apply the "Question" label when appropriate.

## Reporting bugs

Check whether the problem has already been reported. If not, open an issue with:

- The action version or commit SHA.
- The Apptainer version and runner operating system.
- The relevant workflow and error logs.
- Steps to reproduce the problem.

Apply the relevant issue labels.

## Proposing changes

1. Announce your proposed change in an issue before starting work.
1. Wait for agreement on the approach.
1. Fork the repository if needed and create a feature branch from the latest
   main commit. Keep your branch up to date with the upstream repository.
1. Follow the development instructions below and add tests when needed.
1. Update the documentation. Keep the inputs and outputs in
   [action.yml](action.yml) consistent with [README.md](README.md).
1. Push your branch and open a pull request.

If you need help with tests or documentation, open the pull request and explain
what remains to be done.

## Development

### Setup

Use Node.js 24, as specified in `.node-version`. Install dependencies:

```bash
npm ci
```

### Project structure

The development setup is based on
[actions/typescript-action](https://github.com/actions/typescript-action/tree/57b9acc0d972b482f0db345fa09703f3612fda95)
at commit `57b9acc0d972b482f0db345fa09703f3612fda95`.

- `src/index.ts` runs the installation logic exported from `src/main.ts`.
- TypeScript uses ESM and `.js` extensions for local imports.
- Rollup bundles the action and its dependencies into `dist/index.js`.
- Licensed caches dependency license texts in `.licenses/` and checks them in
  CI.
- Jest uses ESM mock fixtures in `__fixtures__` and collects coverage.

### All checks

Run all checks and rebuild the distributable:

```bash
npm run all
```

CI checks formatting, types, linting, and unit tests. Integration tests run on
Ubuntu 22.04, 24.04, and 26.04. A separate workflow verifies that the committed
bundle matches the source. The Super-linter workflow also checks shell scripts,
GitHub Actions workflows, YAML, and Markdown using the template's linter
configuration.

### Type checking, formatting, and linting

```bash
npm run build
npm run format:check
npm run lint
```

### Unit tests and coverage

Run the tests, then update the coverage badge:

```bash
npm test
npm run coverage
```

### Bundling

Format the source and rebuild the distributable:

```bash
npm run bundle
```

Commit the generated `dist/` files and updated coverage badge with source
changes.

### Dependency licenses

The [Licensed workflow](.github/workflows/licensed.yml) follows
[actions/typescript-action](https://github.com/actions/typescript-action#dependency-license-management).
It checks dependency licenses on pull requests and pushes to `main`. License
texts are committed in `.licenses/` alongside the action.

After updating dependencies, run `licensed cache` and `licensed status` with
[Licensed 4.x](https://github.com/licensee/licensed) installed, then commit the
updated `.licenses/` files. You can also run the Licensed workflow manually on
your branch to update and commit the records.

The `debug` record includes notices from `.licenses/amendments/npm/debug/` for
its optional `supports-color` and `has-flag` modules bundled by Rollup. Update
those notices from the installed packages' `license` files when their versions
change.

### Local debugging

Create a local environment file and run the action:

```bash
cp .env.example .env
npm run local-action
```

This runs the real installer. It uses sudo to install missing prerequisites and
load the installation's AppArmor profile when required. Unit tests mock those
commands.

### Docker checks

The Docker helper accepts an Apptainer version and an Ubuntu version. It tests
x64 using a disposable privileged container, which permits nested Apptainer
mounts. Docker and access to its daemon are required.

Test the latest Apptainer release on Ubuntu 26.04:

```bash
script/test-docker
```

Test a pinned Apptainer version on Ubuntu 26.04:

```bash
script/test-docker 1.5.4
```

Test a pinned version on another supported Ubuntu release:

```bash
script/test-docker 1.4.4 24.04
```

The helper downloads Node.js for the container, installs Apptainer as a non-root
user, checks the version, runs Alpine, and verifies local installation reuse. It
installs AppArmor tools and mounts securityfs when the host requires profiles.
Docker shares the host kernel, so AppArmor enforcement on GitHub runners still
needs validation in CI.

### Updating the installer

The installer is pinned to an upstream commit and verified against its SHA-256
in `src/installer.ts`. The unmodified script is also stored as a test fixture
with its original license header.

When updating the installer, update its commit, checksum, test fixture, and
cache recipe version. Runtime AppArmor profiles are loaded separately from the
cached directory.

## Releasing

Run the checks, rebuild the action, and commit and push the generated files
before creating a release.

### Release tags

Run the release helper:

```bash
script/release
```

It prompts for the release version, creates the version tag, updates the major
version tag, and pushes the release tags.

### GitHub release

Create the corresponding release on the
[GitHub releases page](https://github.com/eWaterCycle/setup-apptainer/releases/new).
