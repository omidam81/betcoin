# Git Procedure #

The model used for git branching is described more formally [here](http://nvie.com/posts/a-successful-git-branching-model/)

## Setup ##

Clone the repository to your workstation. This example will use the
[home-ng](https://bitbucket.org/betcn/home-ng) repo.

```sh
git clone git@bitbucket.org/betcn/home-ng
```

## Working ##

All work is done on the `dev` branch of each repo, there is no reason
to ever mess with `master`. Seriously, just don't do it.

The general workflow proceeds as follows

Checkout local `dev` branch and update from `origin`

```sh
git checkout dev
git pull origin dev
```

Create a "feature branch", in this case working on `HOM-42`

```sh
git checkout -b HOM-42
```

Here you do work, with wonderfully informative commit messages along the way.

**Do not push up every commit you make every time! If you accidentally do, skip the rebase command below**

```sh
git fetch
git rebase origin/dev
```

If you accidentally pushed some commits before rebasing, instead do

```sh
git fetch
git merge origin/dev
```

The makes the commit tree more jumbled, but it still works. Rebasing as
mentoined above is the preferred method

NOTE: Only rebase, do not squash commits

## Releasing ##

This is applicable to project admins only. Devs should use the dev
branch of all the repositories for their work. The master branch can
be ignored.

Once all the features for a release have been implemented, make a
snapshot of the `dev` branch by starting a `release-` branch

```sh
git checkout dev
git checkout -b release-1.0.0
git push -u origin release-1.0.0
```

From this point on, only bugfixes and package version maintainence
should go on this branch. The `dev` branch can contiue to be worked on
by others without affecting the release.

Once you have made any last minute changes and upped the package files
version numbers, merge the release branch into `master`, tag it, and
then merge the release changes back into `dev`.

```sh
git checkout master
git merge --no-ff release-1.0.0
git tag -a v1.0.0
git push origin master && git push --tags
git checkout dev
git pull origin dev
git merge --no-ff release-1.0.0
git push origin dev
```

Adding the `-s` flag to the `git tag` command will use GPG to sign the tag

## Hotfixing ##

Hotfixes are similar to releases, except that they branch off master

```sh
git checkout master
git checkout -b hotfix-1.0.1
```

Make the changes you need, then merge back into `master`, tag it, then
merge the hotfix into `dev`

```sh
git checkout master
git merge --no-ff hotfix-1.0.1
git tag -a v1.0.1 -m "hotfix applied"
git push origin master && git push --tags
git checkout dev
git pull origin dev
git merge --no-ff hotfix-1.0.1
git push origin dev
```

## Backing up BitBucket ##

Reuires jshon (can be installed on most linux distros, also a node version available via npm)

```sh
mkdir repo-backup && cd repo-backup
curl -u $bbusername:$bbpass 'https://bitbucket.org/api/2.0/repositories/betcn?pagelen=100' > repos.json
for repo in $(<repos.json jshon -e values -a -e links -e clone -e 1 -e href -u); do g clone --bare $repo; done
cd ../
tar czvf repo-bakcup-YYYYMMDD.tar.gz ./repo-backup
```

Upload the resulting file to S3 or other long term storage
