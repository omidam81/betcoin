# BetCoin Docker Deployment #

NOTE: Do not run the cache-node server on local dev, we only want one
copy of that hitting the liver servers at any one time. Once there is
a replica set replacement for dev (coming soon) we can run it on dev
instances


### DO NOT RUN AS ROOT! Create a betcoin user and add it to the docker group and the sudoers group: ###

```sh
adduser -m betcoin # add a new user: betcoin
gpasswd -a betcoin sudo # add betcoin to sudo group to enable sudo of betcoin
gpasswd -a betcoin docker # add betcoin to docker group to enable running docker cmd from user betcoin
```

you can see these lines in your /etc/group file

```
sudo:x:27:jet,betcoin
docker:x:1002:betcoin,jet
```
# run command `su - betcoin` before continuing #
## Installing Docker ##

You're using Ubuntu. If you're not, do that.

To install the latest version of docker, you'll need to do a few extra things...
```sh
[ -e /usr/lib/apt/methods/https ] || {
  apt-get update
  apt-get install apt-transport-https
}
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 36A1D7869245C8950F966E92D8576A8BA88D21E9
sudo sh -c "echo deb https://get.docker.io/ubuntu docker main > /etc/apt/sources.list.d/docker.list"
sudo apt-get update
sudo apt-get install lxc-docker
```

## Setup ##


In most cases you will never need to build the images, since they are
all hosted on the private docker registry at
https://docker.betcoin.tm.

Contact atticus to get a login for the registry and login with `docker
login https://docker.betcoin.tm`. You do not need to provide anything
in the email field.

### Dev Setup ###

If you're using a Linux VM you will need to edit the /etc/default/docker file like this:

```sh
# some systems use a different path to /etc/default, choose wisely
# run this command as root
vi /etc/default/docker
# insert the following text WITHOUT the # mark:
# DOCKER_OPTS="--storage-driver=devicemapper --restart=false"
# save the file, and REBOOT YOUR DROPLET
# when it comes back up, install grunt (as root)
npm install -g grunt-cli
```

- [docker](http://docker.io)
- make

The build and run scripts are run with make targets. These will
automatically pull the images.

Next, login as the `betcoin` user and clone the docker repo

```sh
su - betcoin
```

To log in to docker:

```sh
docker login https://docker.betcoin.tm
```
Supply the username and password given to you

You might have to check your ~/.dockercfg file, as sometimes the URL is wrong. make sure it looks like:
{"https://docker.betcoin.tm/":{"auth":"(some enccrypted hash of your password after logging in","email":"your email address"}}

setup bitbucket ssh
```sh
# generate rsa key pair
ssh-keygen -t rsa -C "your_email@example.com"

# you can see logs like below
Your identification has been saved in /home/you/.ssh/id_rsa
Your public key has been saved in /home/you/.ssh/id_rsa.pub
# .pub is public key which you can upload to github/bitbucket to enable ssh connection of repo

# add ~/.ssh/id_rsa.pub to your bitbucket account
# https://bitbucket.org/account/user/[your account]/ssh-keys/
# press Add Key, input name of Label, paste content of ~/.ssh/id_rsa.pub to Key field

# clone the repos you'll need
cd ~
git clone git@bitbucket.org:betcn/docker.git
git clone git@bitbucket.org:betcn/player-node.git
git clone git@bitbucket.org:betcn/socket-node.git
git clone git@bitbucket.org:betcn/circle-node.git
```

### Volumes and mongo setup ###

The dev environment uses folders located in `volumes/` to mount mongo and
blockchain data. The folders are named as `<use>-<suffix>` eg
`bitcoin-player` or `mongo-testnet`.

Skeletons are set up under `bitcoind/bitcoin-data` and `mongo/data`

To set up a testnet data volume for the player server:

    #!sh
    cp -r dockerfiles/bitcoind/bitcoin-data volumes/bitcoin-player

You can then edit the `bitcoind.conf` file in this new directory as
needed

To set up the mongo data volume for the player server:

    #!sh
    # in root folder of docker repo, eg: /home/betcoin/docker
    cp -r dockerfiles/mongo-replicaset/data volumes/mongod-testnet
    # make data directories
    mkdir volumes/mongod-testnet/{primary,secondary,arbitor}/db

To init the mongo database for use with the applications, you have to
(one time for every new mongo data volume you create) use a shell in
the container to set up the username and password

    #!sh
    # in root folder of docker repo, eg: /home/betcoin/docker
    cd dockerfiles/mongo-replicaset
    make SUFFIX=testnet shell
    # you will now be in the docker container shell
    # set permissions on the replica set key
    chown mongodb:65535 /data/rs0.key
    chmod 600 /data/rs0.key
    # wait a minute for mongo to start properly and
    # allocate it's journal space, then
    # start up the mongo shell
    mongo
    > use admin
    > var conf = {
          _id:"rs0",
          members: [
              { _id: 0, host: "localhost:27017" },
              { _id: 1, host: "localhost:27018" },
              { _id: 2, host: "localhost:27019", arbiterOnly: true }
          ]
      };
    > rs.initiate(conf);
    > db.addUser('admin', 'admin')
    <Ctrl-d> twice

This enables the auth on the mongo instances so the apps will work properly.
##### Please note that mongo is not accessible anymore through dockerfiles/mongo-replicaset make shell command #####
##### You actually do not need to access the database server directly, ask an administrator for help #####


## Now that you've started the replica set, you can actually start the mongo ambassadors: ##


    #!sh
    # in root folder of docker repo, eg: /home/betcoin/docker
    cd dockerfiles/mongo-replicaset
    # SUFFIX matches the -tesnet suffix on the data folder
    make run SUFFIX=testnet
    
    
    
### Right, so now we start bringing our docker apps online. Bitcoin is first, and it's a bit different: ###
    #!sh
    cd ~/docker/dockerfiles/bitcoind
    # set up configuration
    vi env/default
    # enter the following lines into the file:
    MONGO_USER=admin
    MONGO_PASSWORD=admin
    MONGO_REPLICASET=rs0
    # :wq to quit and save
    # SUFFIX again matches the folder suffix, but this also names the docker instance
    # run-testnet is used because different ports have to be set up for testnet
    # run-mainnet is available as well
    make SUFFIX=player run-testnet

### Env files ###

Each project repo has an `env` directory. This contains line
separated environment variables for the container you are running.

The default file used is `env/default` you can override this by using
`make RUNENV=nameofenvfile run`

An example `env/default` file for the player server

#### Place the ENV files directly into the repo directories. For example, ~/player-node/env/default, NOT in dockerfiles directory ####

## 1st, make player server env file ##
You can copy this file directly
```
MONGO_USER=admin
MONGO_PASSWORD=admin
RPCUSER=testnet
RPCPASSWORD=testnetrpc
MANDRILL_KEY=foobarkey
NODE_ENV=production

VIRTUAL_HOST=local.betcoin.tm
PROXY_PORT=443
API_MOUNT=account
UPSTREAM=player-node
```
## now make circle env file, here is an example

```sh
MONGO_USER=admin
MONGO_PASSWORD=admin
MONGO_REPLICA_SET=rs0
APP_KEY=appname:YOURAPPKEY
VIRTUAL_HOST=local.betcoin.tm
NODE_ENV=development

PROXY_PORT=443
API_MOUNT=circle
UPSTREAM=circle-api
```

## App key setup ##

All apps that talk to the player server need an app key. Create it by going to player_node directory and running `make appkey APP=circle` then insert it into the env/default for circle-node, for example

```sh
cd ~/player-node
make appkey APP=circle
```
Insert the entire string, including the username (something like circle:023joi;seo;82348uweoisdf) into the env/default for circle-node


In most cases the app will complain when it is missing an environment
variable.

## Docker Proxy ##
The `VIRTUAL_HOST`, `PROXY_PORT`, `API_MOUNT`, and `UPSTREAM` variables are used by
the `docker.betcoin.tm/docker-proxy` container. It reads all the
containers environments looking for these keys, and if it finds them,
it will set up an SSL proxy to the app on the specified host and port.



## `etcd` and `etcd-updater` ##

`etcd` is used to communicate configuration between containers (in our
case, the ip address of the support containers). To start these
containers, run `make run` in the `dockerfiles/etcd` and
`dockerfiles/etcd-updater` directories.

## DNS Setup ##

Because we use an nginx proxy (the dockerproxy from above) to service
all API requests, and it is set up to use a hostname (not IP), either
a real DNS record or setting something in your hosts file is REQUIRED.

Once you create something in your hosts file you can set your client
build to use `yoursubdomain.betcoin.tm` for the api endpoints

You must either add `YOUR_SERVER_IP yoursubdomain.yourdomain.com` to
your `/etc/hosts` file on any *nix system to make the ssl validation
check out in the browser/with curl

in /etc/hosts, 172.17.0.85 is ip of dockerproxy of docker container
```
172.17.0.85	local.betcoin.tm
```

OR you can create a real DNS record and use that in your ENV files.

Lastly, set your api.local.js in the front-end configs to point to
your new server.

### Socket Server ###

All socket traffic is now routed through a central socket server. The
Makefile for running this container can be found in the `socket-node`
repo. Before running this, run the `etcd` and `etcd-updater`
containers (Makefiles are in the `docker` repo). Then you can run the
socket-node server. Make sure to either run it on a separate port or a
separate virtual host, with `API_MOUNT=` (blank)

## Running from scratch ##

After running and setting up the mongo and bitcoind containers, you
can start the application containers.

```sh
# You can use a different VERSION if needed, but unless otherwise made know to you,
# the dev tag is the one to use

cd ~/docker/dockerfiles/mongo-replicaset && make SUFFIX=testnet run
cd ~/docker/bitcoind/ && make SUFFIX=player run-testnet

cd player-node
npm install
vi env/default
# edit the env file as mentioned above in `Env Files`
make VERSION=dev all run

cd ~/socket-node
npm install
make run

cd circle-node
npm install
vi env/default
# edit the env file as mentioned above in `Env Files`
make VERSION=dev all run

cd docker/dockerfiles/dockerproxy
make run
# you now have you apps running on the ports you specified
```

## Updating code and re-deploying ##

When you have made changes to your code, either directly in your VM (make sure you PUSH that stuff!) or outside your VM:

```sh
# assuming you need to pull the latest changes
git pull origin dev
make VERSION=dev all run
```

If you've only made changes to the env/default file you can just run `make VERSION=dev run`

### VERSION, SUFFIX, and other makefile variables can be auto-completed with tab (in zsh at least...) ###
#### `cat Makefile` to check out what you can do ####

##Setup on Non-Ubuntu OS##
If you are not using the ubuntu as your primary operating system, you will need to setup the docker container environment
with the help of virtual machine.

It suggests to use the [Virtualbox](https://www.virtualbox.org/wiki/Downloads), to setup an ubuntu VM as the guest OS.
Then follow the setup documentation described above for the betcoin containers.

When the basic containers and the *-node container has been started, check the run.log to see if there are any errors. If no errors prompted in the logs, that means they are successfully built and running.

###Verify Setup###

Put YOUR_VM_IP local.betcoin.tm to your DNS file. For example, on Mac OSX, put the entry in the /etc/hosts. This routes the requests
for the local.betcoin.tm to your VM's nginx docker container.

Then you test if the nginx container works with the player-node container by opening https://local.betcoin.tm/account/auth in browser,
if it returns a json, your basic docker setup is done correctly.

###Run docker as daemon on VM ubuntu###
Okay, you now have the docker containers running properly inside the VM. But we still need to make the host OS connect to
the VM's docker, so the code on the host OS can be tested without too much trouble.

We will use the docker on the VM ubuntu as the primary docker daemon for all containers. To make it work seamlessly on the host OS,
we need to run the VM ubuntu's docker as daemon. In the `/etc/default/docker` under the VM ubuntu, put the following line to make
docker run as daemon, and listen to the port `4243`
```
DOCKER_OPTS="--storage-driver=devicemapper --restart=false -H unix:///var/run/docker.sock -H tcp://0.0.0.0:4243"
```
Restart your VM, and start all the basic containers inside the VM, mongodb related, etcd, etcd-updater, dockerproxy, socket-node.
The mongodb related containers have to run inside the VM, since it requires certain level of access to the data folder.

Setup the [docker client](http://boot2docker.io/). Note, we just use the docker client came with the installation package.
We don't need the boot2docker VM it comes with, as we already setup the one that suit our needs.

Set the environment variable `DOCKER_HOST=YOUR VM IP:YOUR DOCKER PORT` on Host OS. This let the docker client to know where to
connect to the docker daemon.

Type `docker version` in your Host OS shell, if it prompts the version information of the docker without any error messages,
then you have wired the host docker client with the docker daemon on the VM ubuntu.

###Share folder between Host###
Since we want to run the code on the changes made on Host OS straightaway, we need to find a proper way to share the source code folder on host to the VM ubuntu. The reason we need to share it to the VM ubuntu is because docker daemon on the VM assume the source code
is located inside the VM. If you `make all run` on the source folder on host without sharing the folder to the VM, it would eventually
prompt errors relating to the folder permission issues.

So you have to share the folder to the VM as the exact same path of the host. For example, if you are running `make all run` under
the player-node folder /betcoin/player-node on your host, your VM should have the shared folder using the path /betcoin

Also, you have to mount the share folder as owned by betcoin user and betcoin group on VM. Type `id` in your VM, it should show the
user id and group id of the `betcoin`. Get the uid and gid of `betcoin` and use it in the following command to mount the share folder.

`sudo mount -t vboxsf -o uid=1001,gid=1001 SHARENAME /betcoin`

The `SHARENAME` is the name of the share you configured on the Virtualbox's share setting, check out the settings UI on the Virtualbox.

Note: you will need to install [Guest Additions](https://help.ubuntu.com/community/VirtualBox/SharedFolders), so to be able to mount
the share folders.


Once all of these tricks are done, you should be able to call the command `make VERSION=dev all run` on your host OS shell directly for the *-node containers. Check the run.log. If there are no errors, you are ready!



# Most of you can stop now #


## ENV FILE DETAILS ##
The `API_MOUNT` variable mounts the server's API at a specified path
on the proxied server. Take the following two env files:

env/default file in player-node
```
VIRTUAL_HOST=local.betcoin.tm
PROXY_PORT=443
API_MOUNT=account
UPSTREAM=player-api
```

env/default file in circle-node, or other backend node repo
```
VIRTUAL_HOST=local.betcoin.tm
PROXY_PORT=443
API_MOUNT=circle
UPSTREAM=circle-api
```

Both servers would be accessable on `local.betcoin.tm` on port 443,
but any calls to `player-api` are prefixed with `/account`
(ex. `/account/auth` instead of just `/auth`) and the calles the
`circle-api` would be prefixed with `/circle` (so
`/circle/circle/next` instead of just `/circle/next`)

## Issuing Bitcoind commands and connection to database
The testnet blockchain may take a bit to download, but once it does you can use
it again for other testnet data volumes. For example, to use a downloaded
player testnet blockchain for a prize server

    #!sh
    cp -r dockerfiles/bitcoind/bitcoin-data volumes/bitcoin-prize
    mkdir volumes/bitcoin-prize/testnet3
    sudo cp -r volumes/bitcoin-player/testnet3/{blocks,chainstate} volumes/bitcoin-prize/testnet3

You can test that the testnet container is ready by issuing the following.

    #!sh
    IP=$(docker inspect "bitcoind_player" | grep IPAddress | awk '{print $2}' | tr -d '",')
    docker run --entrypoint "/usr/bin/bitcoind" docker.betcoin.tm/bitcoind -testnet -rpcuser=testnet -rpcpassword=testnetrpc -rpcconnect=$IP getinfo

You can also use this method to issue other bitcoind commands to the container.
For example, to get an address to feed into the player server you set up, run

    #!sh
    IP=$(docker inspect "bitcoind_player" | grep IPAddress | awk '{print $2}' | tr -d '",')
    docker run --entrypoint "/usr/bin/bitcoind" docker.betcoin.tm/bitcoind -testnet -rpcuser=testnet -rpcpassword=testnetrpc -rpcconnect=$IP getnewaddress change

This will return a new testnet address for you to send coins to.

## Database setup ##
```sh
cd docker/dockerfiles/mongo
make MONGO_IP=$(docker inspect "mongo_amb_primary" | grep IPAddress | awk '{print $2}' | tr -d '",') shell
```

Now you're in the shell. Run some commands to get your newly created env/default file in sync with the DB permissions:

```sh
# switch to the database that you are using for this app, in this example, we are building player-node
use playerdb
db.addUser('the username you set in env/default', 'the password...')
# if you are developing craps, [playerdb] will be crapsdb, app name defined in node repo
# ./src/container/index.js:6:container.register('appName', 'craps');
# ./src/container/index.js:53:container.register('namespace', 'craps');
```

