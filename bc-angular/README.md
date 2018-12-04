# bc-angular for devs #

## STEP 1 Clone the repo ##
### `git clone git@bitbucket.org:betcn/bc-angular && cd bc-angular` ###

## STEP 2 RUN NPM INSTALL ##

## STEP 3 Grunt w/options ##
it automatically looks at conf=live but you can override.
grunt --conf dev --prod tiles (for paigow tiles example)

## STEP 4 RUNNING NODE SERVER ##
need to run in bc-angular folder: node node/server --loc en_US --port 3002
because "server" is in bc-angular/node folder.

#### STEP 5 HIT LOCALHOST:3002/ in web browser to see results after you Grunt and run node server successfully ####

## Setup FOR SERVER ADMINS##

Clone the repo `git clone git@bitbucket.org:betcn/bc-angular && cd bc-angular`

Build the webapps with `make CONF=dev`

If you want to point to the live site, leave off the `CONF=dev` above
or change it to `CONF=live`

You can also use a custom conf file to point to localhost or elsewhere
is you are using your own server setup for dev.

```sh
cp config/dev.js config/local.js
vi local.js
# edit the file to point to your desired server
```

For example, if you want to interact with local docker development env
```
$ cat config/local.js
module.exports = {
    hostname: 'local.betcoin.tm'
};
# this means that api url point to local.betcoin.tm,
# PS: setup local development env according to dev-docs/docker.md
```

```
make CONF=local
```

Then run the node server with `node server`

You can then access the sites at http://localhost:3002

## Docker Container ##

To make a docker container run `make container`

You can use `CONF=dev` or `CONF=local` to specify different conf files.

To run the container, first you must have a running copy of
`docker.betcoin.tm/docker-proxy` running

```sh
git clone git@bitbucket.org:betcn/docker
cd docker/dockerfiles/dockerproxy
make run
```

Then, back in the `bc-angular` directory, edit `env/default` and add the following lines

```
VIRTUAL_HOST=www.betcoin.tm
PROXY_PORT=443
API_MOUNT=
UPSTREAM=frontend-node
```

`VIRTUAL_HOST` should be changed to however you are accessing the
container, be that `frontdev.betcoin.tm` or a hostname defined in
`/etc/hosts`

--- TIPS ---
It covers tips that helped me to work in the project.
This guide is written by a starter to the project.

1) NodeJS issues
- Issue1: NPM's version should be higher than 1.4.6.
- Solution: You can install npm with the version 1.4.6 by following command.
	npm install npm@1.4.6 -g

- Issue2: While "npm update" is not updating all the required packages, it seems You don't have previllege to .npm folder.
- Solution: The chown command me helped for this issue. Thus as my user name is david, the following command obtains privillege to the .npm foler.
	chown -R david:david /home/david/.npm

2) Build issues
You can build node server by following command.
	node node/server --port 3002
	node node/server --loc zh_CN --port 3001 (for chinese version)
You can build apps by following commands.
	grunt --prod home
	grunt --prod home --loc zh_CN
- Issue1: Currently app links on localhost redirect to product site link.
I.E. If You click conflip game on localhost, it redirects to betcoin.tm/conflip.
- Solution: You need to build conflip on localhost by following command.
	grunt --prod conflip
Then You can check the conflip at localhost/conflip

3) Login issues
In order to login sites You need to create betcoin wallet at https://blockchain.info/wallet/new.

4) Commit works
If You want to commit your work to Bitbucket, You need to follow these steps.
1. create a branch for issue name in Jira
2. commit
3. push to your branch
4. create a pull request with Bitbucket
	(Target branch name is always "DEV". You need also to put your leader's full name as  reviewer's name )