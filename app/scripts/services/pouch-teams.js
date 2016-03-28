/**
 * teams.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */

(function () {
  "use strict";

  class Team {
    constructor(team, userName) {
      var rand = Math.floor(Math.random(100)*100);
      var d = new Date();
      this.id = d.getTime()+"-"+rand;
      this.name = team ? team.name : '';
      this.rating = team ? team.rating : 1500;
      this.gamesCount = team ? team.gamesCount  : 0;
      this.avatar = team ? team.avatar : defaultAvatar;
      this.username = team ? team.username : userName;
      this.playersIds = team ? team.playersIds : [];

      return this;
    }
  };

  angular.module("teams").provider("pouchTeamsService", [function () {

    this.userName = "";
    this.basePoints = 1500;

    this.$get = ["$log", "$q", "pouchPlayersService", function ($log, $q, playerService) {

      var userName = this.userName;
      var basePoints = this.basePoints;
      var defaultAvatar = "app/assets/images/default-team-avatar.jpg";

      // POUCH
      var teamsDb = new PouchDB('teams');

      function getTeams() {
        var deferred = $q.defer();
        teamsDb.allDocs({
          include_docs: true,
          attachments: true
        }, function(error, result){
          // {total_rows: 0, offset: 0, rows: []}
          var games = [];//result.rows;
          for (var i = 0; i < result.rows.length; i++) {
            games[i] = result.rows[i].doc;
          }
          deferred.resolve(games);
        });
        return deferred.promise;
      }


      /*
       function saveTeam(team) {
       var newTeam = new parseTeam;
       //var ACLs = User.acl();
       newTeam.save({
       "username": userName,
       "name": team.name,
       "avatar": team.avatar,
       "rating": team.rating,
       "playersIds":team.playersIds
       }
       ).then(
       function (savedTeam) {
       deferred.resolve(prepareTeamToList(savedTeam));
       }
       );
       }*/

      /**
       *
       * @param players
       * @returns {Array}
       */
      function idsFromPlayers(players) {
        var playersIds = [];
        for (var p = 0; p < players.length; p++) {
          playersIds.push(players[p].id);
        }
        playersIds = playersIds.sort();
        return playersIds;
      }

      function findTeamByPlayers(players) {
        // TODO
        return getTeams();
      }

      function findTeamByName(teamName) {
        // TODO
        return getTeams();
      }

      function findTeamById(id) {
        // TODO
        return getTeams();
      }

      function updatePlayers(playersIds, totalTeamPointsGained) {
        $log.debug("UPDATE " + playersIds.length + " PLAYERS, ids");
        $log.debug(playersIds);
        $log.debug("totalTeamPointsGained");
        $log.debug(totalTeamPointsGained);
        var deferred = $q.defer();
        if (playersIds.length <= 0) {
            $log.error("players empty in a team ? WTF ?");
            throw new EventException();
        }
        var pointsPerPlayer = (totalTeamPointsGained / playersIds.length);

        for (var i = 0; i < playersIds.length; i++) {
            playerService.findById(playersIds[i]).then(function (player) {
                player.gamesCount += 1;
                player.rating += pointsPerPlayer;
                playerService.update(player).then(function () {
                    if ((i + 1) >= playersIds.length) {
                        $log.debug("resolve update players;");
                        deferred.resolve();
                    }
                });
            });
        }
        return deferred.promise;
      }

      function updateTeam(team, pointsGained) {
        var updateFinishedPromise = $q.defer();
        var query = new Parse.Query(parseTeam);
        query.get(team.id, {
            success: function (teamToUpdate) {
                $log.debug("teamToUpdate.save");
                teamToUpdate.save({
                    "name": team.name,
                    "rating": team.rating,
                    "avatar": team.avatar,
                    "gamesCount": team.gamesCount
                }).then(function (savedTeam) {
                    $log.debug("team saved, update players");
                    updatePlayers(team.playersIds, pointsGained).then(
                        function () {
                            updateFinishedPromise.resolve(prepareTeamToList(savedTeam));
                        },
                        function (fail) {
                            $log.debug(fail);
                            debugger;
                            updateFinishedPromise.reject(fail);
                        }
                    );
                });
            },
            error: function (error) {
                //alert("Error: " + error.code + " " + error.message);
                updateFinishedPromise.reject(error);
            }
        });
        return updateFinishedPromise.promise;
      }

      function addTeam(teamName, players) {
        var deferred = $q.defer();
        var toSave = new Team({
          playersIds: idsFromPlayers(players),
          name : teamName,
          gamesCount: 0,
        }, userName);
        console.log("Team ready to be saved : ");
        console.log(toSave);

        playersDb.post(toSave, function(error, result){
          deferred.resolve(result);
        });
        return deferred.promise;
      }

      function removeTeam(team) {
        if (team.id) {
          //TODO
        }
      }

      function randomTeamName(players){
        if(players.length === 1){
            return players[0].name;
        }else{
          var names = [
            "toffee","croissant", "oat","cake", "gummies", "ice", "cream", "danish",
            "jellybeans", "macaroon", "candy", "wafer", "sesame", "hand", "wood",
            "orange", "key", "window", "card", "shoe", "bread", "bar", "awesome",
            "snaps", "pie", "danish", "chupa chups", "chocolate", "cotton",
            "candy", "sweet", "cheesecake", "ice", "cream", "jelly", "sheep",
            "brownie", "souffle", "carrot cake", "toffee", "ice cream", "icing", "bear",
            "claw", "cookie", "topping", "claw", "pastry", "lollipop", "topping","ham","fine","ugly","fast",
            "jaws","bag","sky","team","soldiers", "pizza", "water", "beer", "foot", "head"
          ];

          var a = Math.floor(Math.random() * names.length);
          var b = Math.floor(Math.random() * names.length);

          return names[a].charAt(0).toUpperCase() + names[a].substr(1) +" "+ names[b];
        }
      }

      return {
        format: function () {return new Team({rating: basePoints}, userName)},
        findByName: findTeamByName,
        findById: findTeamById,
        findByPlayers: findTeamByPlayers,
        list: getTeams,
        remove: removeTeam,
        add: addTeam,
        update: updateTeam,
        teamNameFor: randomTeamName
      };
    }];
  }]);
})();
