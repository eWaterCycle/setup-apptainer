# Contributing guidelines

We welcome any kind of contributions to our software, from simple comment or
question to a full fledged
[pull request](https://help.github.com/articles/about-pull-requests/). Please
read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

A contribution can be one of the following cases:

1. you have a question;
2. you think you may have found a bug (including unexpected behavior);
3. you want to make some kind of change to the code base (e.g. to fix a bug, to
   add a new feature, to update documentation).
4. you want to make a release

The sections below outline the steps in each case.

## You have a question

1. use the search functionality
   [here](https://github.com/eWaterCycle/setup-apptainer/issues) to see if
   someone already filed the same issue;
2. if your issue search did not yield any relevant results, make a new issue;
3. apply the \"Question\" label; apply other labels when relevant.

## You think you may have found a bug

1. use the search functionality
   [here](https://github.com/eWaterCycle/setup-apptainer/issues) to see if
   someone already filed the same issue;
2. if your issue search did not yield any relevant results, make a new issue,
   making sure to provide enough information to the rest of the community to
   understand the cause and context of the problem. Depending on the issue, you
   may want to include: - the
   [SHA hashcode](https://help.github.com/articles/autolinked-references-and-urls/#commit-shas)
   of the commit that is causing your problem; - some identifying information
   (name and version number) for dependencies you\'re using; - information about
   the operating system;
3. apply relevant labels to the newly created issue.

## You want to make some kind of change to the code base

1. (**important**) announce your plan to the rest of the community _before you
   start working_. This announcement should be in the form of a (new) issue;
2. (**important**) wait until some kind of consensus is reached about your idea
   being a good idea;
3. if needed, fork the repository to your own Github profile and create your own
   feature branch off of the latest main commit. While working on your feature
   branch, make sure to stay up to date with the main branch by pulling in
   changes, possibly from the \'upstream\' repository (follow the instructions
   [here](https://help.github.com/articles/configuring-a-remote-for-a-fork/) and
   [here](https://help.github.com/articles/syncing-a-fork/));
4. install the package dependencies with `npm ci`;
5. make sure the existing tests still work by running `npm test`;
6. add your own tests (if necessary);
7. update or expand the documentation; Make sure the `inputs` in
   [action.yml](action.yml) file are in-sync with their descriptions in
   [README.md#inputs](README.md#inputs);
8. [push](http://rogerdudler.github.io/git-guide/) your feature branch to (your
   fork of) the ewatercycle repository on GitHub;
9. create the pull request, e.g. following the instructions
   [here](https://help.github.com/articles/creating-a-pull-request/).

In case you feel like you\'ve made a valuable contribution, but you don\'t know
how to write or run tests for it, or how to generate the documentation: don\'t
let this discourage you from making the pull request; we can help you! Just go
ahead and submit the pull request, but keep in mind that you might be asked to
append additional commits to your pull request.

## You want to make a release

This section is for maintainers of the setup-apptainer action.

### Development and build

Use Node.js 24 (the version in `.node-version`) and install dependencies with
`npm ci`.

The development setup is based on
[actions/typescript-action](https://github.com/actions/typescript-action/tree/57b9acc0d972b482f0db345fa09703f3612fda95)
at commit `57b9acc0d972b482f0db345fa09703f3612fda95`.

The action uses the tooling from that template:

- `src/index.ts` runs the installation logic exported from `src/main.ts`.
- TypeScript uses ESM and `.js` extensions for local imports.
- Rollup bundles the action and its dependencies into `dist/index.js`.
- Jest uses ESM mock fixtures in `__fixtures__` and collects coverage.

Run all checks and rebuild the distributable with:

```bash
npm run all
```

Individual commands are also available:

```bash
npm run build         # Type-check without emitting files
npm run format:check  # Check repository formatting
npm run lint
npm test
npm run coverage     # Update badges/coverage.svg after running tests
npm run bundle       # Format and rebuild dist/
```

Commit the generated `dist/` files and updated coverage badge with source
changes. CI runs formatting, linting, unit tests, and integration tests on
Ubuntu 22.04, 24.04, and 26.04. A separate workflow rebuilds `dist/` and checks
that it matches what is committed.

To debug locally on Ubuntu, copy `.env.example` to `.env` and run
`npm run local-action`. This runs the real installer and uses `sudo` to add the
Apptainer PPA and install packages on your machine. Unit tests mock those
commands.

### Publish

After committing and pushing the checked and bundled action, run
`script/release` to create a version tag, update the major version tag, and push
the release tags. The script prompts for the release version before making
changes.

Create the corresponding GitHub release at
<https://github.com/eWaterCycle/setup-apptainer/releases/new>.
