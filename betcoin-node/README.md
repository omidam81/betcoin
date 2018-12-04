# Betcoin Api #

## Setup ##

First install docker. The following are instructions for Ubuntu 14.04
or 14.10

First become root

```shell
sudo su -

wget -qO- https://get.docker.io/gpg | apt-key add -
echo 'deb http://get.docker.io/ubuntu docker main' > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install lxc-docker-1.3.3

```
Then after it is installed, add your regular user to the docker group

```shell
gpasswd -a yourRegularUsernameHere docker
```

Then leave root

```shell
exit
```

You will need a directory structure like the following set up. The
bootstrap process will create a `volumes/` directory as a sibling to
the two repo directories.

```
- betcoin-backend
|
|- betcoin-node
|- crypto-wallet
```

Make a directory for the backend and enter it

```shell
mkdir betcoin-backend
cd betcoin-backend
```

Clone the repos

```shell
git clone git@bitbucket.org:betcn/betcoin-node
git clone git@bitbucket.org:betcn/crypto-wallet
```

After cloning the repos, enter each one and run `npm install` to get
all the dependencies needed for building (runtime dependencies are
installed inside the containers already).

Log into docker (if you have not already). If you need an account
contact atticus.

```shell
docker login https://docker.betcoin.tm
```

First you must bootstrap the mongo replica set and blockchains. Run
```
cd betcoin-node
make bootstrap
```

The blockchains will take a while to
sync, especially litecoin.

The bootstrap process will set up a mongo replicaset, and a blockchain
for each currency. It will also popluate default values for the
configuration files.

After this is finished, check the `env/default` file and make sure the
`VIRTUAL_HOST` value matches an entry in your `/etc/hosts` file
pointing to the IP where this server is running

Now you can run the app

To start up the services:

```shell
make mongo coins proxy
```

Next build a testing container that you will have shell access to.

```shell
make testshell
```

This will put you into a shell inside the container. You can then run
`make test` or call `grunt` directly to run the test suite.

To run tests:

```bash
# this will run all of the tests
make test
# this will run just the api testing
grunt simplemocha:api
# this will run only the tests located at ./test/games/circle.js
# the path you give is relative to the ./test directory
grunt simplemocha:api --test games/circle
# you can set the log level to see the app logs while running a test (they are silent by default)
grunt test --log-level verbose
```

To run the application inside your testing container, make sure you are in the `/app` folder and run

```shell
grunt jshint && node src/app --log-level verbose
```

This will start up the application and you can start making API
calls. Make sure to set up the `/etc/hosts` file. A typical setup would look like this:

```
127.0.0.1 localhost local.betcoin.tm
```

This allows you to hit the API at `https://local.betcoin.tm`.

The files under `src/` and `test/` are mounted inside the container so
you can make changes and run tests for specific items without having
to build the test image on every single change.

## Helper Script ##

Inclided in `bin/` is a helper script called `dockr`. This allows you
to get some easy info and easily shell into a container.

To make the script run anywhere, run:

```shell
mkdir $HOME/bin
ln -s ./bin/dockr $HOME/bin/dockr
```

Then make sure your `$HOME/bin` folder is in your path.

The two most useful commands ar `ip` and `shell`

`dockr ip <container name>` will give you the ip address on the docker network.

`dockr shell <container name>` will give you a bash shell inside the
container. Useful for poking around while the app is running. When you
are in the shell you can restart the betcoin-node app by running `sv
restart app`

## Game Modules ##

A game module is located under `src/games` and is loaded dynamically
by the main application. The only requirement is that the module is a
directory, with at least an `index.js` file in it. This file must have
a [dependable](https://github.com/idottv/dependable) compatable method
signature and must return it's "value" synchronously.

The value it returns it not of much consequence, as the `index.js`
file will handle registering the routing for the game

See any existing module for a reference.

### Porting ###

Porting an existing game is fairly simple.

First, make a folder for the module and create an `index.js` file that
exports a single function with the dependencies for the game
(generally `app`, `gameModelStore`, `io`, and `logger`). Then copy
over the routing from the game's `src/routes/index.js` file.

Second, move the model file(s) for the game into the module
directory. You then `require()` the model from the `index.js` file and
set it up for the controller (next step). In the model, remove all
references to the `PlayerInterface`, since debiting and crediting the
user is handled by the `BaseGameController`.

Finally, make a new controller file and inherit from either
`BaseGameController` or `BaseMultipartGameController` and override the
required methods. See `dice` and `blackjack` for examples of this.

Also make sure that the schema for
the model has at least the following values (and of course that they
are being set to a meaningful value):

- `currency` - The currency the game was played in
- `wager` - The total amount the player wagered on the game
- `winnings` - The total amount won by the player, even if it is 0 (the winnings should include the stake)
- `createdAt` - The time the game was played

Currency is injected into the gameParams by the `BaseGameController`
superclass. The model for the game is responsible for declaring this
field and setting it on itself when the `play()` function is run.

##Setup on Mac OSX##
If you are not using the ubuntu as your primary operating system, you will need to setup the docker container environment
with the help of virtual machine.

It suggests to use the [Virtualbox](https://www.virtualbox.org/wiki/Downloads), to setup an ubuntu VM as the guest OS.
Then follow the setup documentation described above for the betcoin containers.


###Run docker as daemon on VM ubuntu###
You now have the docker containers running properly inside the VM. But we still need to make the host OS connect to
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
is located inside the VM.

So you have to share the folder to the VM as the exact same path of the host. For example, if you are running `make testshell` under
the folder /betcoin/betcoin-node on your host, your VM should have the shared folder using the path /betcoin

Also, you have to mount the share folder as owned by betcoin user and betcoin group on VM. Type `id` in your VM, it should show the
user id and group id of the `betcoin`. Get the uid and gid of `betcoin` and use it in the following command to mount the share folder.

`sudo mount -t vboxsf -o uid=1001,gid=1001 SHARENAME /betcoin`

The `SHARENAME` is the name of the share you configured on the Virtualbox's share setting, check out the settings UI on the Virtualbox.

Note: you will need to install [Guest Additions](https://help.ubuntu.com/community/VirtualBox/SharedFolders), so to be able to mount
the share folders.


###Make testshell for changes from Mac###
You will need two copies of the betcoin-node repo. One is located at the native folder of the ubuntu VM. Another one is located at the shared folder,
 so you can make changes directly to the code on your Mac.

For bootstrapping and starting the services other than `make testshell`, you will need to execute them at the betcoin-node folder from the native folder(not the shared folder) 
of the ubuntu VM. Then

`touch .bootstrap` at the betcoin-node folder from the shared folder. This avoid to run the bootstrap script again

Copy the betcoin-node/env/default file from the native folder to this shared folder.

`make testshell` to start the test container.

This enables it start up the services(`make mongo coins proxy`) properly on ubuntu, while you are able to do changes and test them directly on your Mac.


