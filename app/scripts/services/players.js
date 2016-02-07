/**
 * players.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
    "use strict";
    angular.module("players", []);
    angular.module("players").provider("localPlayersService", [function () {

        this.basePoints = 1500;

        this.$get = ["$log", function ($log) {

            var basePoints = this.basePoints;

            var playerFormat = {
                "id": 0,
                "name": "",
                "rating": basePoints,
                "gamesCount":0,
                "avatar":""
            };

            function getPlayers() {
                var deferred = $q.defer();
                var stored = JSON.parse(localStorage.getItem("players"));
                deferred.resolve(stored ? stored : []);
                return deferred.promise;
            }


            function savePlayers(players) {
                var deferred = $q.defer();
                localStorage.setItem("players", JSON.stringify(players));
                deferred.resolve(players);
                return deferred.promise;
            }

            function findPlayerByName(name) {
                var deferred = $q.defer();
                var players = getPlayers();
                var playerIndex;
                var found = false;
                for (playerIndex in players) {
                    if (players[playerIndex] && players[playerIndex].name) {
                        if (players[playerIndex].name.indexOf(name) === 0 && players[playerIndex].name === name) {
                            // player found, returning it.
                            found = true;
                            deferred.resolve(players[playerIndex]);
                        }
                    }
                }
                if(!found){
                    deferred.reject();
                }
                // player not found return false
                return deferred.promise;
            }

            function findPlayerById(id) {
                var deferred = $q.defer();
                var players = getPlayers();
                var playerIndex;
                var found = false;
                for (playerIndex in players) {
                    if (players[playerIndex] && players[playerIndex].id) {
                        if (players[playerIndex].id === id) {
                            // player found, returning it.
                            found = true;
                            deferred.resolve(players[playerIndex]);
                        }
                    }
                }
                if(!found){
                    deferred.reject();
                }
                // player not found return false
                return deferred.promise;
            }

            function updatePlayer(player) {
                var deferred = $q.defer();

                var players = getPlayers();
                var changed = false;
                // udpate players
                // search players in players
                var playerIndex;
                for (playerIndex in players) {
                    if (players[playerIndex] && players[playerIndex].id) {
                        if (players[playerIndex].id === player.id) {
                            // player found, must be updated
                            players[playerIndex] = player;
                            changed = true;
                        }
                    }
                }
                if (changed) {
                    // save updated players
                    savePlayers(players).then(function(players){
                        deferred.resolve(players);
                    });
                }
                return deferred.promise;
            }

            function addPlayer(playerName) {
                var deferred = $q.defer();
                var players = getPlayers();
                var playersCount = players.length;
                var player = angular.copy(playerFormat);
                player.name = playerName;
                player.id = playersCount + 1;

                players.push(player);

                // save players if player list changed
                if (playersCount < players.length) {
                    savePlayers(players).then(function(players){
                        deferred.resolve(player);
                        $log.info("player added");
                    });
                }
                return deferred.promise;
            }

            return {
                "format": angular.copy(playerFormat),
                "findByName": findPlayerByName,
                "findById": findPlayerById,
                "list": getPlayers,
                "add": addPlayer,
                "update": updatePlayer
            };
        }];
    }]);
})();