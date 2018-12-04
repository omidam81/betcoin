### Setting up a fresh database and wallet ###

Pull the docker image

```sh
docker pull docker.betcoin.tm/prize-base
```

Set the environment correctly (see the overall docker docs for this)
and get a no server container running just a shell

```sh
cd ~/docker/dockerfiles/prize-node

# get the addresses from bitcoind and set up config values the default
# game interval is 15 minutes

make addressgen

# now generate the games
# use the --dev flag to only generate 60 days of games, default is 10 years

for game in 1 3 7 9 15; do make gamegen GAME=$game; done
```


