'use strict';

var argv = require('yargs')
        .demand(3)
        .argv;
var Etcd = require('node-etcd');
var etcd = new Etcd('172.17.42.1', 4001);
var exec = require('child_process').exec;
var format = require('util').format;

var DOCKER_BIN = '/usr/bin/docker';

var CONTAINER_NAME = argv._[0];
var PORT = argv._[1];
var SERVICE_NAME = "service/" + argv._[2];

var DOCKER_CMD = format('%s port %s %d', DOCKER_BIN, CONTAINER_NAME, PORT);

setInterval(function() {
    exec(DOCKER_CMD, function(err, stdout) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        var parts = stdout.replace(/\n/, '').split(":");
        var dataObj = {host: parts[0], port: parts[1]};
        var jsonString = JSON.stringify(dataObj);
        console.log(SERVICE_NAME, jsonString);
        etcd.set(SERVICE_NAME, jsonString);
    });
}, 5000);
