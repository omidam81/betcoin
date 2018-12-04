'use strict';

var PrizesController = function($scope) {
    $scope.prizes = [
        {
            "player_id" : "20688b9aa58c52f30b1973046d3e634f",
            "prize" : 1000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 58838,
            "league" : "Bronze"
        },
        {
            "player_id" : "1500ce8029a8d49cc5c8ec471ee76850",
            "prize" : 500000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 44442,
            "league" : "Bronze"
        },
        {
            "player_id" : "398ff7a754752e886a3b98d5be9b99c5",
            "prize" : 300000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 37294,
            "league" : "Bronze"
        },
        {
            "player_id" : "08de657665c7d5a12a1c26b2deab1fcd",
            "prize" : 10000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 49838,
            "league" : "Silver"
        },
        {
            "player_id" : "eeb136d34a878a08e41e9c22f621bfb9",
            "prize" : 5000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 48390,
            "league" : "Silver"
        },
        {
            "player_id" : "3ad2e8bf5aa720cbbf28e6d8d4f618ac",
            "prize" : 3000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 47231,
            "league" : "Silver"
        },
        {
            "player_id" : "1dcd21492d6fd2f77d7a601ae63302ee",
            "prize" : 100000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 1605734,
            "league" : "Gold"
        },
        {
            "player_id" : "ab255e1c69108864503312c0a6303e5f",
            "prize" : 50000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 1345354,
            "league" : "Gold"
        },
        {
            "player_id" : "0d830ebbf7552b333f721653a18cb083",
            "prize" : 30000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 937166,
            "league" : "Gold"
        },
        {
            "player_id" : "27bb508a12711aa02475c43d4a2c7d42",
            "prize" : 1000000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 38747571,
            "league" : "Platinum"
        },
        {
            "player_id" : "ff95b36c03d89c0f35821df9ce4450fa",
            "prize" : 500000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 33850000,
            "league" : "Platinum"
        },
        {
            "player_id" : "cf01831673dc224b646ae7287a7be93f",
            "prize" : 300000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 33134827,
            "league" : "Platinum"
        },
        {
            "player_id" : "765d49833985059aac5287b107e1cabf",
            "prize" : 10000000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 1853219812,
            "league" : "Diamond"
        },
        {
            "player_id" : "fe5043917cb7e156932b66d9a1e5f90d",
            "prize" : 5000000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 207082100,
            "league" : "Diamond"
        },
        {
            "player_id" : "34e623a18b4c5f9f4fe00a5d133bdfaa",
            "prize" : 3000000000,
            "date" : "2014-02-01T12:00:00.0Z",
            "points" : 126368880,
            "league" : "Diamond"
        },

        {
            "league":"Bronze",
            player_id:"20688b9aa58c52f30b1973046d3e634f",
            "prize":1000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":58838
        },
        {
            "league":"Bronze",
            "player_id":"1500ce8029a8d49cc5c8ec471ee76850",
            "prize":500000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":44442
        },
        {
            "league":"Bronze",
            "player_id":"398ff7a754752e886a3b98d5be9b99c5",
            "prize":300000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":37294
        },
        {
            "league":"Silver",
            "player_id":"08de657665c7d5a12a1c26b2deab1fcd",
            "prize":10000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":49838
        },
        {
            "league":"Silver",
            "player_id":"eeb136d34a878a08e41e9c22f621bfb9",
            "prize":5000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":48390
        },
        {
            "league":"Silver",
            "player_id":"3ad2e8bf5aa720cbbf28e6d8d4f618ac",
            "prize":3000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":47231
        },
        {
            "league":"Gold",
            "player_id":"1dcd21492d6fd2f77d7a601ae63302ee",
            "prize":100000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":1605734
        },
        {
            "league":"Gold",
            "player_id":"ab255e1c69108864503312c0a6303e5f",
            "prize":50000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":1345354
        },
        {
            "league":"Gold",
            "player_id":"78bc75b1e1b2bf0cc5434fb89714659b",
            "prize":30000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":632943
        },
        {
            "league":"Platinum",
            "player_id":"27bb508a12711aa02475c43d4a2c7d42",
            "prize":1000000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":38747571
        },
        {
            "league":"Platinum",
            "player_id":"ff95b36c03d89c0f35821df9ce4450fa",
            "prize":500000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":33850000
        },
        {
            "league":"Platinum",
            "player_id":"cf01831673dc224b646ae7287a7be93f",
            "prize":300000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":33134827
        },
        {
            "league":"Diamond",
            "player_id":"34e623a18b4c5f9f4fe00a5d133bdfaa",
            "prize":10000000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":126368880
        },
        {
            "league":"Diamond",
            "player_id":"DongFangBuBai",
            "prize":5000000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":73154690
        },
        {
            "league":"Diamond",
            "player_id":"af0892ddf1b9db0763f96c1e6bb4a7c9",
            "prize":3000000000,
            "date":"2014-01-01T12:00:00.0Z",
            "points":58059382
        },

        // nextmonth            
        {
            "league":"Bronze",
            player_id:"20688b9aa58c52f30b1973046d3e634f",
            "prize":1000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":58838
        },
        {
            "league":"Bronze",
            "player_id":"1500ce8029a8d49cc5c8ec471ee76850",
            "prize":500000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":44442
        },
        {
            "league":"Bronze",
            "player_id":"398ff7a754752e886a3b98d5be9b99c5",
            "prize":300000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":37294
        },
        {
            "league":"Silver",
            "player_id":"08de657665c7d5a12a1c26b2deab1fcd",
            "prize":10000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":49838
        },
        {
            "league":"Silver",
            "player_id":"eeb136d34a878a08e41e9c22f621bfb9",
            "prize":5000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":48390
        },
        {
            "league":"Silver",
            "player_id":"3ad2e8bf5aa720cbbf28e6d8d4f618ac",
            "prize":3000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":47231
        },
        {
            "league":"Gold",
            "player_id":"1dcd21492d6fd2f77d7a601ae63302ee",
            "prize":100000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":1605734
        },
        {
            "league":"Gold",
            "player_id":"ab255e1c69108864503312c0a6303e5f",
            "prize":50000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":1345354
        },
        {
            "league":"Gold",
            "player_id":"78bc75b1e1b2bf0cc5434fb89714659b",
            "prize":30000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":632943
        },
        {
            "league":"Platinum",
            "player_id":"27bb508a12711aa02475c43d4a2c7d42",
            "prize":1000000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":38747571
        },
        {
            "league":"Platinum",
            "player_id":"ff95b36c03d89c0f35821df9ce4450fa",
            "prize":500000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":33850000
        },
        {
            "league":"Platinum",
            "player_id":"cf01831673dc224b646ae7287a7be93f",
            "prize":300000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":33134827
        },
        {
            "league":"Diamond",
            "player_id":"DongFangBuBai",
            "prize":10000000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":73154690
        },
        {
            "league":"Diamond",
            "player_id":"af0892ddf1b9db0763f96c1e6bb4a7c9",
            "prize":5000000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":58059382
        },
        {
            "league":"Diamond",
            "player_id":"ec2f373b02acb0cc485562dbb14d16df",
            "prize":3000000000,
            "date":"2013-12-01T12:00:00.0Z",
            "points":53026941
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"80710034f984a1603619cf711176b02a",
            league:"Bronze",
            points:758,
            btcWon:"0.00608511",
            prize:300000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"eraserpt",
            league:"Bronze",
            points:900,
            btcWon:"0.55838493",
            prize:500000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"7014ccf4c052f4d1fbccd1254c040ecc",
            league:"Bronze",
            points:923,
            btcWon:"0.56267869",
            prize:1000000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"mrremington",
            league:"Silver",
            points:2426,
            btcWon:"3.36014085",
            prize:3000000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"HangMan ",
            league:"Silver",
            points:2896,
            btcWon:"6.96228880",
            prize:5000000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"0443d79e525f869dbc77f6d8b72f12dc",
            league:"Silver",
            points:7215,
            btcWon:"7.48887221",
            prize:10000000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"cf01831673dc224b646ae7287a7be93f",
            league:"Gold",
            points:31579,
            btcWon:"96.29399627",
            prize:30000000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"6d1846f0b5f2f61fd77d9a9d39a76f88",
            league:"Gold",
            points:34823,
            btcWon:"82.19538435",
            prize:50000000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"hannibal",
            league:"Gold",
            points:45478,
            btcWon:"0",
            prize:100000000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"malignus",
            league:"Platinum",
            points:64001,
            btcWon:"154.41125826",
            prize:300000000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"af0892ddf1b9db0763f96c1e6bb4a7c9",
            league:"Platinum",
            points:65287,
            btcWon:"584.36422038",
            prize:500000000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"0eb632c59867dbf0a4613f7ee9401e12",
            league:"Platinum",
            points:67317,
            btcWon:"937.09148720",
            prize:1000000000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"BitcoinGremlin",
            league:"Diamond",
            points:72829,
            btcWon:"7798.64066297",
            prize:3000000000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"53c8f9dabd97693df8858176dcd67bd0",
            league:"Diamond",
            points:75827,
            btcWon:"3767.58594782",
            prize:5000000000
        },
        {
            date:"2013-10-01T12:00:00.0Z",
            player_id:"CoolNigga",
            league:"Diamond",
            points:95955,
            btcWon:"6262.42908904",
            prize:10000000000
        }
    ];
};

Application.Controllers.controller('PrizesController', ["$scope", PrizesController]);
