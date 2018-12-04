# Circle Server #

```sh
# circle-env.sh
export MONGO_PORT_27017_TCP=tcp://localhost:27017
export MONGO_USER=circleapi
export MONGO_PASSWORD=123
export PLAYER_SERVER_PORT_441_TCP=tcp://localhost:8441
export APP_KEY=circle:foobar
```

```sh
source circle-env.sh && noe app
```
