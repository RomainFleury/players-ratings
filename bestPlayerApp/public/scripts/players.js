/**
 * players.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
    "use strict";
    angular.module("players", []);
    angular.module("players").provider("simplePlayersService", [function () {

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
                var stored = JSON.parse(localStorage.getItem("players"));
                return stored ? stored : [];
            }


            function savePlayers(players) {
                localStorage.setItem("players", JSON.stringify(players));
            }

            function findPlayerByName(name) {
                var players = getPlayers();
                var playerIndex;
                for (playerIndex in players) {
                    if (players[playerIndex] && players[playerIndex].name) {
                        if (players[playerIndex].name.indexOf(name) === 0) {
                            // player found, returning it.
                            return players[playerIndex];
                        }
                    }
                }
                // player not found return false
                return false;
            }

            function findPlayerById(id) {
                var players = getPlayers();
                var playerIndex;
                for (playerIndex in players) {
                    if (players[playerIndex] && players[playerIndex].id) {
                        if (players[playerIndex].id === id) {
                            // player found, returning it.
                            return players[playerIndex];
                        }
                    }
                }
                // player not found, return false
                return false;
            }

            function updatePlayer(player) {
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
                    savePlayers(players);
                }
            }

            function addPlayer(playerName) {
                var players = getPlayers();
                var playersCount = players.length;
                var player = angular.copy(playerFormat);
                player.name = playerName;
                player.id = playersCount + 1;

                players.push(player);

                // save players if player list changed
                if (playersCount < players.length) {
                    savePlayers(players);
                    $log.info("player added");
                }
                return player;
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
                "save": savePlayers,
                "remover": removePlayer,
                "add": addPlayer,
                "update": updatePlayer
            };
        }];
    }]);
})();