### Setting up a fresh database and wallet ###

Pull the docker image

```sh
docker pull docker.betcoin.tm/dice-handler
```

Set the environment correctly (see the overall docker docs for this)
and run the make targets

```sh
cd ~/docker/dockerfiles/dice-handler
make addressgen
make gamegen
```


