/**
 * players.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
  "use strict";

  class Team {
    constructor(name, rating) {
      var rand = Math.floor(Math.random(100)*100);
      var d = new Date();
      this.id = d.getTime()+"-"+rand;
      this.name = name;
      this.rating = rating ? rating : 1500;
    }
  }

  class Game {
    constructor(userId) {
      var teamAExpectedVictory = 0.5;
      var scoreA = 2;
      var scoreB = 0;
      var teamA = new Team("A", 1527);
      // {
      //     "id": 1,
      //     "name": "A",
      //     "rating": "1500"
      // };
      var ratingA = teamA.rating;
      var teamB = new Team("B", 1473);
      // {
      //     "id": 1,
      //     "name": "A",
      //     "rating": "1500"
      // };
      var ratingB = teamB.rating;
      var coteA = 2;
      var coteB = 2;

      this.userId = userId
      var rand = Math.floor(Math.random(100)*100);
      var d = new Date();
      this.id = d.getTime()+"-"+rand;
      this.date = d;
      this.teamAExpectedVictory = teamAExpectedVictory;
      this.teamAVictory = (scoreA > scoreB);
      this.teamAId = teamA.id;
      this.scoreA = scoreA;
      this.teamAPointsEarned = (teamA.rating - ratingA);
      this.teamARatingBeforeGame = ratingA;
      this.teamARatingAfterGame = teamA.rating;
      this.teamAQuotation = Math.round((1 / coteA) * 100) / 100;

      this.teamBId = teamB.id;
      this.scoreB = scoreB;
      this.teamBPointsEarned = (teamB.rating - ratingB);
      this.teamBRatingBeforeGame = ratingB;
      this.teamBRatingAfterGame = teamB.rating;
      this.teamBQuotation = Math.round((1 / coteB) * 100) / 100;
    }
  }

  angular.module("games").provider("pouchTeamgamesService", [function () {

    this.userName = "";

    this.$get = ["$log", "$q", function ($log, $q) {
      var userName = this.userName;

      // PARSE
      var teamGamesDb = new PouchDB('teamgames');

      function prepareGameToList(savedGame) {
          var tmp = new Game;
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
          //var ACLs = User.acl();
          teamGamesDb.put(game).then(
              function (savedGames) {
                  deferred.resolve(prepareGameToList(savedGames));
              }
          );
          return deferred.promise;
      }

      function createGame(game) {
        deferred = $q.defer();
        teamGamesDb.post(game, function(error, result){
          deffered.resolve(response);
        })
      }

      function addGame(game) {
          var gameDate = new Date();
          if (!game.date) {
              game.date = gameDate;
          }

          // save games if player list changed
          return saveGame(game);
      }

      return {
          "username": userName,
          "format": new Game,
          "list": getGames,
          "add": addGame
      };
    }];
  }]);
})();
