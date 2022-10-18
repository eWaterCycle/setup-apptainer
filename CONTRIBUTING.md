# Contributing guidelines

We welcome any kind of contributions to our software, from simple
comment or question to a full fledged [pull
request](https://help.github.com/articles/about-pull-requests/). Please
read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

A contribution can be one of the following cases:

1. you have a question;
2. you think you may have found a bug (including unexpected behavior);
3. you want to make some kind of change to the code base (e.g. to fix a
    bug, to add a new feature, to update documentation).
4. you want to make a release

The sections below outline the steps in each case.

## You have a question

1. use the search functionality
    [here](https://github.com/setup-apptainer/setup-apptainer/issues) to see if
    someone already filed the same issue;
2. if your issue search did not yield any relevant results, make a new
    issue;
3. apply the \"Question\" label; apply other labels when relevant.

## You think you may have found a bug

1. use the search functionality
    [here](https://github.com/setup-apptainer/setup-apptainer/issues) to see if
    someone already filed the same issue;
2. if your issue search did not yield any relevant results, make a new
    issue, making sure to provide enough information to the rest of the
    community to understand the cause and context of the problem.
    Depending on the issue, you may want to include: - the [SHA
    hashcode](https://help.github.com/articles/autolinked-references-and-urls/#commit-shas)
    of the commit that is causing your problem; - some identifying
    information (name and version number) for dependencies you\'re
    using; - information about the operating system;
3. apply relevant labels to the newly created issue.

## You want to make some kind of change to the code base

1. (**important**) announce your plan to the rest of the community
    *before you start working*. This announcement should be in the form
    of a (new) issue;
2. (**important**) wait until some kind of consensus is reached about
    your idea being a good idea;
3. if needed, fork the repository to your own Github profile and create
    your own feature branch off of the latest main commit. While working
    on your feature branch, make sure to stay up to date with the main
    branch by pulling in changes, possibly from the \'upstream\'
    repository (follow the instructions
    [here](https://help.github.com/articles/configuring-a-remote-for-a-fork/)
    and [here](https://help.github.com/articles/syncing-a-fork/));
4. install the package dependencies with
    `npm install`;
5. make sure the existing tests still work by running `npm run test`;
6. add your own tests (if necessary);
7. update or expand the documentation; Please add [Google Style Python
    docstrings](https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings).
8. [push](http://rogerdudler.github.io/git-guide/) your feature branch
    to (your fork of) the ewatercycle repository on GitHub;
9. create the pull request, e.g. following the instructions
    [here](https://help.github.com/articles/creating-a-pull-request/).

In case you feel like you\'ve made a valuable contribution, but you
don\'t know how to write or run tests for it, or how to generate the
documentation: don\'t let this discourage you from making the pull
request; we can help you! Just go ahead and submit the pull request, but
keep in mind that you might be asked to append additional commits to
your pull request.

## You want to make a release

This section is for maintainers of the setup-apptainer action.

### Build

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 16, for instance.

Install the dependencies  
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```

### Publish

Actions are run from GitHub repos so we will checkin the packed dist folder. 

Then run [ncc](https://github.com/zeit/ncc) and push the results:
```bash
$ npm run build && npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
```

Create a release on https://github.com/setup-apptainer/setup-apptainer/releases/new with semantic versioning.

Create short tag (`v<number>`) with
```
git pull
git tag -fa v2 -m "Update v2 tag"
git push origin v2 --force
```

Your action is now published! :rocket: 

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
