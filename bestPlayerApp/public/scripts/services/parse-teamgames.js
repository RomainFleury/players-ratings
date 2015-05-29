/**
 * players.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
    "use strict";
    angular.module("games").provider("parseTeamgamesService", [function () {

        this.userName = "";

        this.$get = ["$log", "$q", function ($log, $q) {

            var userName = this.userName;

            var d = new Date();

            var teamAExpectedVictory = 0.5;
            var scoreA = 2;
            var scoreB = 0;
            var teamA = {
                "id": 1,
                "name": "A",
                "rating": "1527"
            };
            var ratingA = 1500;
            var teamB = {
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
                teamAExpectedVictory: teamAExpectedVictory,
                teamAVictory: (scoreA > scoreB),

                teamAId: teamA.id,
                scoreA: scoreA,
                teamAPointsEarned: (teamA.rating - ratingA),
                teamARatingBeforeGame: ratingA,
                teamARatingAfterGame: teamA.rating,
                teamAQuotation: Math.round((1 / coteA) * 100) / 100,

                teamBId: teamB.id,
                scoreB: scoreB,
                teamBPointsEarned: (teamB.rating - ratingB),
                teamBRatingBeforeGame: ratingB,
                teamBRatingAfterGame: teamB.rating,
                teamBQuotation: Math.round((1 / coteB) * 100) / 100
            };

            // PARSE
            var parseGame = Parse.Object.extend("teamgame");

            function prepareGameToList(savedGame) {
                var tmp = angular.copy(gameFormat);
                tmp.id = savedGame.id;
                tmp.username = savedGame.attributes.username;
                tmp.date = savedGame.attributes.date;
                tmp.teamAExpectedVictory = savedGame.attributes.teamAExpectedVictory;
                tmp.teamAVictory = savedGame.attributes.teamAVictory;
                tmp.teamAId = savedGame.attributes.teamAId;
                tmp.scoreA = savedGame.attributes.scoreA;
                tmp.teamAPointsEarned = savedGame.attributes.teamAPointsEarned;
                tmp.teamARatingBeforeGame = savedGame.attributes.teamARatingBeforeGame;
                tmp.teamARatingAfterGame = savedGame.attributes.teamARatingAfterGame;
                tmp.teamAQuotation = savedGame.attributes.teamAQuotation;
                tmp.teamBId = savedGame.attributes.teamBId;
                tmp.scoreB = savedGame.attributes.scoreB;
                tmp.teamBPointsEarned = savedGame.attributes.teamBPointsEarned;
                tmp.teamBRatingBeforeGame = savedGame.attributes.teamBRatingBeforeGame;
                tmp.teamBRatingAfterGame = savedGame.attributes.teamBRatingAfterGame;
                tmp.teamBQuotation = savedGame.attributes.teamBQuotation;
                tmp.createdAt = savedGame.createdAt;
                tmp.username = userName;
                return tmp;
            }

            function getGames() {
                var deferred = $q.defer();
                var game = Parse.Object.extend("teamgame");
                var query = new Parse.Query(game);
                query.equalTo("username", userName);
                query.find({
                    success: function (results) {
                        var games = [];
                        if (results.length > 0) {
                            for (var i = 0; i < results.length; i++) {
                                games[i] = prepareGameToList(results[i]);
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
            }

            function saveGame(game) {
                var deferred = $q.defer();
                var newGame = new parseGame;
                //var ACLs = User.acl();
                newGame.save({
                        "date": game.date,
                        "teamAExpectedVictory": game.teamAExpectedVictory,
                        "teamAVictory": game.teamAVictory,
                        "teamAId": game.teamAId,
                        "scoreA": game.scoreA,
                        "teamAPointsEarned": game.teamAPointsEarned,
                        "teamARatingBeforeGame": game.teamARatingBeforeGame,
                        "teamARatingAfterGame": game.teamARatingAfterGame,
                        "teamAQuotation": game.teamAQuotation,
                        "teamBId": game.teamBId,
                        "scoreB": game.scoreB,
                        "teamBRatingBeforeGame": game.teamBRatingBeforeGame,
                        "teamBRatingAfterGame": game.teamBRatingAfterGame,
                        "teamBPointsEarned": game.teamBPointsEarned,
                        "teamBQuotation": game.teamBQuotation,
                        "username": userName
                    }
                ).then(
                    function (savedGames) {
                        deferred.resolve(prepareGameToList(savedGames));
                    }
                );
                return deferred.promise;
            }

            function addGame(game) {
                //var newGame = angular.copy(gameFormat);
                var gameDate = new Date();
                if (!game.date) {
                    game.date = gameDate;
                }

                // save games if player list changed
                return saveGame(game);
            }

            return {
                "username": userName,
                "format": angular.copy(gameFormat),
                "list": getGames,
                "add": addGame
            };
        }];
    }]);
})();
