/**
 * players.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
    "use strict";
    angular.module("players").provider("parsePlayersService", [function () {

        this.userName = "";
        this.basePoints = 1500;

        this.$get = ["$log", "$q", function ($log, $q) {

            var userName = this.userName;
            var basePoints = this.basePoints;
            var defaultAvatar = "/images/default-avatar.jpg";
            // PARSE
            var parsePlayer = Parse.Object.extend("player");

            var playerFormat = {
                "id": 0,
                "name": "",
                "rating": basePoints,
                "gamesCount": 0,
                "avatar": defaultAvatar,
                "username": userName
            };

            function preparePlayerToList(player) {
                var tmp = angular.copy(playerFormat);
                tmp.id = player.id;
                tmp.username = player.attributes.username;
                tmp.name = player.attributes.name;
                tmp.rating = player.attributes.rating;
                tmp.avatar = player.attributes.avatar;
                tmp.gamesCount = player.attributes.gamesCount;
                return tmp;
            }

            function getPlayers() {
                var deferred = $q.defer();
                var query = new Parse.Query(parsePlayer);
                query.equalTo("username", userName);
                query.find({
                    success: function (results) {
                        var players = [];
                        if (results.length > 0) {
                            for (var i = 0; i < results.length; i++) {
                                players[i] = preparePlayerToList(results[i]);
                            }
                        }
                        deferred.resolve(players);
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
            }


            function savePlayer(player) {
                var newPlayer = new parsePlayer;
                //var ACLs = User.acl();
                newPlayer.save({
                        "username": userName,
                        "name": player.name,
                        "avatar": player.avatar,
                        "rating": player.rating
                    }
                ).then(
                    function (savedPlayer) {
                        deferred.resolve(preparePlayerToList(savedPlayer));
                    }
                );
            }

            function findPlayerByName(playerName) {
                var deferred = $q.defer();
                var qb = new Parse.Query(parsePlayer);
                var usernameQuery = qb.matches("username", userName);
                var query = Parse.Query.or(usernameQuery);
                query.limit(100);
                query.find({
                    success: function (results) {
                        if (results.length > 0) {
                            for (var i = 0; i < results.length; i++) {
                                if (results[i].attributes.name === playerName) {
                                    var player = preparePlayerToList(results[i]);
                                    deferred.resolve(player);
                                }
                            }
                            deferred.reject();
                        } else {
                            deferred.reject();
                        }
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
            }

            function findPlayerById(id) {
                var deferred = $q.defer();
                var query = new Parse.Query(parsePlayer);
                query.get(id, {
                    success: function (result) {
                        var player = preparePlayerToList(result);
                        deferred.resolve(player);
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
            }

            function updatePlayer(player) {
                var deferred = $q.defer();
                var query = new Parse.Query(parsePlayer);
                query.get(player.id, {
                    success: function (savedPlayer) {
                        savedPlayer.save({
                            "name":player.name,
                            "avatar":player.avatar,
                            "rating":player.rating,
                            "gamesCount":player.gamesCount
                        }).then(function () {
                            deferred.resolve(preparePlayerToList(savedPlayer))
                        });
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
            }

            function addPlayer(playerName) {
                var deferred = $q.defer();
                var player = angular.copy(playerFormat);
                player.name = playerName;

                var newPlayer = new parsePlayer;
                //var ACLs = User.acl();
                newPlayer.save({
                        "username": userName,
                        "name": playerName,
                        "avatar": defaultAvatar,
                        "rating": basePoints,
                        "gamesCount":0
                    }
                ).then(
                    function (savedPlayer) {
                        deferred.resolve(preparePlayerToList(savedPlayer));
                    }
                );
                return deferred.promise;
            }

            function removePlayer(player) {
                if (player.id) {
                    //TODO
                }
            }

            return {
                "format": angular.copy(playerFormat),
                "findByName": findPlayerByName,
                "findById": findPlayerById,
                "list": getPlayers,
                "remove": removePlayer,
                "add": addPlayer,
                "update": updatePlayer
            };
        }];
    }]);
})();