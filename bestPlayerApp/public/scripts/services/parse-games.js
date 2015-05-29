/**
 * players.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
    "use strict";
    angular.module("games").provider("parseGamesService", [function () {

        this.userName = "";

        this.$get = ["$log", "$q", function ($log, $q) {

            var userName = this.userName;

            var d = new Date();

            var playerAExpectedVictory = 0.5;
            var scoreA = 2;
            var scoreB = 0;
            var playerA = {
                "id": 1,
                "name": "A",
                "rating": "1527"
            };
            var ratingA = 1500;
            var playerB = {
                "id": 1,
                "name": "A",
                "rating": "1500"
            };
            var ratingB = 1473;
            var coteA = 2;
            var coteB = 2;

            var gameFormat = {
                id: d.getTime(),
                date: d,
                playerAExpectedVictory: playerAExpectedVictory,
                playerAVictory: (scoreA > scoreB),

                playerAId: playerA.id,
                playerAName: playerA.name,
                scoreA: scoreA,
                playerARatingBeforeGame: ratingA,
                playerARatingAfterGame: playerA.rating,
                playerAQuotation: Math.round((1 / coteA) * 100) / 100,

                playerBId: playerB.id,
                playerBName: playerB.name,
                scoreB: scoreB,
                playerBRatingBeforeGame: ratingB,
                playerBRatingAfterGame: playerB.rating,
                playerBQuotation: Math.round((1 / coteB) * 100) / 100
            };

            // PARSE
            var parseGame = Parse.Object.extend("game");

            function getGames() {
                var deferred = $q.defer();
                var game = Parse.Object.extend("game");
                var query = new Parse.Query(game);
                query.equalTo("username", userName);
                query.find({
                    success: function (results) {
                        var games = [];
                        if (results.length > 0) {
                            for (var i = 0; i < results.length; i++) {
                                if (results[i].attributes && results[i].attributes.data) {
                                    games[i] = JSON.parse(results[i].attributes.data);
                                }
                            }
                        }
                        deferred.resolve(games);
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
                //var stored = JSON.parse(localStorage.getItem("games"));
                //return stored ? stored : [];
            }

            function saveGame(game) {
                var deferred = $q.defer();
                var newGame = new parseGame();
                //var ACLs = User.acl();
                newGame.save({
                        "username": userName,
                        "data": JSON.stringify(game)
                    }
                ).then(
                    function (savedGames) {
                        deferred.resolve(JSON.parse(savedGames.attributes.data));
                    }
                );
                return deferred.promise;
            }

            function addGame(game) {
                //var newGame = angular.copy(gameFormat);
                var gameDate = new Date();
                game.id = gameDate.getTime();
                if (!game.date) {
                    game.date = gameDate;
                }

                // save games if player list changed
                return saveGame(game);
            }

            return {
                "format": angular.copy(gameFormat),
                "list": getGames,
                "add": addGame
            };
        }];
    }]);
})();