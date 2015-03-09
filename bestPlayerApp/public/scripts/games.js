/**
 * players.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
    "use strict";
    angular.module("games", []);
    angular.module("games").provider("simpleGamesService", [function () {

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
            var parseGames = Parse.Object.extend("games");

            function getGames() {
                var deferred = $q.defer();
                var games = Parse.Object.extend("games");
                var query = new Parse.Query(games);
                query.equalTo("user", userName);
                query.find({
                    success: function (results) {
                        $log.debug(results);
                        var games = JSON.parse(results[0].attributes.games);
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


            function saveGames(games) {
                //localStorage.setItem("games", JSON.stringify(games));
                var deferred = $q.defer();
                var newGame = new parseGames;
                //var ACLs = User.acl();
                var date = new Date();
                newGame.save({
                        "user":userName,
                        "games":JSON.stringify(games)
                    }
                ).then(
                    function(savedGames){
                        savedGames = savedGames;
                        debugger;
                        deferred.resolve(savedGames);
                    }
                );
                return deferred.promise;
            }

            function addGame(game) {
                var games = getGames();
                var gamesCount = games.length;
                //var newGame = angular.copy(gameFormat);
                var gameDate = new Date();
                game.id = gameDate.getTime();
                if (!game.date) {
                    game.date = gameDate;
                }

                games.push(game);

                // save games if player list changed
                if (gamesCount < games.length) {
                    saveGames(games);
                    $log.info("game added by service");
                }
                return game;
            }

            function removeGame(game) {
                if (game.id) {
                    //TODO
                }
            }

            return {
                "format": angular.copy(gameFormat),
                "list": getGames,
                "save": saveGames,
                "remove": removeGame,
                "add": addGame
            };
        }];
    }]);
})();