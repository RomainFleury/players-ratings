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
                teamARatingBeforeGame: ratingA,
                teamARatingAfterGame: teamA.rating,
                teamAQuotation: Math.round((1 / coteA) * 100) / 100,

                teamBId: teamB.id,
                scoreB: scoreB,
                teamBRatingBeforeGame: ratingB,
                teamBRatingAfterGame: teamB.rating,
                teamBQuotation: Math.round((1 / coteB) * 100) / 100
            };

            // PARSE
            var parseGame = Parse.Object.extend("teamgame");

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
            }

            function saveGame(game) {
                var deferred = $q.defer();
                var newGame = new parseGame;
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


var t = {
    "user": "digitaleo",
    "date": "2015-03-27T10:58:48.042Z",
    "teamAExpectedVictory": true,
    "teamAVictory": true,
    "teamAId": "vzzBqcyy2A",
    "teamAName": "ClémentM",
    "scoreA": 4,
    "teamARatingBeforeGame": 1677,
    "teamARatingAfterGame": 1706.3566133482893,
    "teamAPointsEarned": 29.3566133483,
    "teamAQuotation": 1.92,
    "teamBId": "KCkNaQY8xP",
    "teamBName": "ClémentR",
    "scoreB": 2,
    "teamBRatingBeforeGame": 1662,
    "teamBRatingAfterGame": 1638.6433866517107,
    "teamBPointsEarned": -23.3566133483,
    "teamBQuotation": 2.09,
    "id": 1427968808528
};