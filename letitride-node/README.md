# Game Server Caribbean #

This is a basic game setup that uses the betcoin provably fair module
and player server.

This contrived example simulates a coin flip.

To start converting this template, change all instances of `Caribbean`
and `reel` to an appropriate app name

Also adjust `runit/run` to correctly launch the app inside the
container (contact Atticus for bash help if you need it)

## Modules Used ##

The modules used to build this framework and their relevant docs/source

#### Betcoin Modules ####

- [logger-npm](https://bitbucket.org/betcn/logger-npm)
- [httperror-npm](https://bitbucket.org/betcn/httperror-npm)
- [provably-fair-npm](https://bitbucket.org/betcn/provably-fair-npm)
- [player-interface-node](https://bitbucket.org/betcn/player-interface-node)

#### Main Third Party Modules ####

- [express](http://expressjs.com) version 4, middleware no longer bundled
- [modella](https://github.com/modella/modella)
- [modella-mongo](https://github.com/modella/mongo)
- [mongoskin](https://github.com/kissjs/node-mongoskin)
- [dependable](https://github.com/idottv/dependable) dependency injection
- [mocha](http://visionmedia.github.io/mocha/) testing framework

## Building Docker ##

The Dockerfile included will build the application into a
container. To do this simply run `make` to build and `make run` to
run, see the
[docker repo](https://bitbucket.org/betcn/docker/overview) for more
info on setting up environments and docker in general
