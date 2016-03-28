/**
 * players.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
  "use strict";

  class Game {
    constructor(game, teamA, teamB, userName) {
      var scoreA = game ? game.scoreA : 0;
      var scoreB = game ? game.scoreB : 0;
      var teamA = teamA ? teamA : new Team("A", 1527);
      var ratingA = teamA ? teamA.rating : 1500;
      var teamB = teamB ? teamB : new Team("B", 1473);
      var ratingB = teamB ? teamB.rating : 1500;
      var coteA = 2;
      var coteB = 2;

      var colors = {
        1:'red',
        2:'yellow',
        3:'green',
        4:'blue',
        5:'lightblue'
      }

      this.color = colors[Math.floor(Math.random()*10)]

      this.userId = userName;
      var rand = Math.floor(Math.random(100)*100);
      var d = new Date();
      this.id = d.getTime()+"-"+rand;
      this.date = d;
      this.teamA = teamA;
      this.teamAExpectedVictory = 0.5;
      this.teamAVictory = (scoreA > scoreB);
      this.teamAId = teamA.id;
      this.scoreA = scoreA;
      this.teamAPointsEarned = (teamA.rating - ratingA);
      this.teamARatingBeforeGame = ratingA;
      this.teamARatingAfterGame = teamA.rating;
      this.teamAQuotation = Math.round((1 / coteA) * 100) / 100;

      this.teamBId = teamB.id;
      this.teamB = teamB;
      this.scoreB = scoreB;
      this.teamBPointsEarned = (teamB.rating - ratingB);
      this.teamBRatingBeforeGame = ratingB;
      this.teamBRatingAfterGame = teamB.rating;
      this.teamBQuotation = Math.round((1 / coteB) * 100) / 100;
      this.userName = userName

      return this.resolve();
    }

    resolve(){
      return this;
    }
  };

  angular.module("games").provider("pouchTeamgamesService", [function () {

    this.userName = "";

    this.$get = ["$log", "$q", "pouchTeamsService", function ($log, $q, teamsService) {
      var userName = this.userName;

      // PARSE
      var teamGamesDb = new PouchDB('teamgames');

      function getGames() {
        var deferred = $q.defer();
        teamGamesDb.allDocs({
          include_docs: true,
          attachments: true
        }, function(error, result){
          // {total_rows: 0, offset: 0, rows: []}
          var games = result.rows;
          for (var i = 0; i < result.rows.length; i++) {
            games[i] = result.rows[i].doc;
          }
          deferred.resolve(games);
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
        var deferred = $q.defer();
        var toSave = new Game(game);

        teamGamesDb.post(toSave, function(error, result){
          deferred.resolve(result);
        });
        return deferred.promise;
      }

      function addGame(game) {
        if (!game.date) {
          var gameDate = new Date();
          game.date = gameDate;
        }

        return createGame(game);

        // // save games if player list changed
        // return saveGame(game);
      }

      return {
          username: userName,
          format: function(game, teamA, teamB){return new Game(
            game, teamsService.format(teamA), teamsService.format(teamB), self.username)},
          list: getGames,
          add: addGame
      };
    }];
  }]);
})();
