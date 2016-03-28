/**
 * players.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
  "use strict";

  class Player {
    constructor(player, userName, basePoints, defaultAvatar) {
      this.userId = userName;
      var rand = Math.floor(Math.random(100)*100);
      var d = new Date();
      this.id = d.getTime()+"-"+rand;
      this.name = player ? player.name : "";
      this.rating = player ? player.rating : basePoints;
      this.gamesCount = player ? player.gamesCount : 0;
      this.avatar = player ? player.avatar : defaultAvatar;
      this.username = userName;
      this.nickname = player ? player.nickname : "";
      return this;
    }
  }

  angular.module("players").provider("pouchPlayersService", [function () {

    this.userName = "";
    this.basePoints = 1500;

    this.$get = ["$log", "$q", function ($log, $q) {
      var userName = this.userName;
      var basePoints = this.basePoints;
      var defaultAvatar = "app/assets/images/default-avatar.jpg";

      // POUCH
      var playersDb = new PouchDB('players');

      registeredPlayers = [];

      function getPlayers() {
        var deferred = $q.defer();
        playersDb.allDocs({
          include_docs: true,
          attachments: true
        }, function(error, result){
          // {total_rows: 0, offset: 0, rows: []}
          var players = [];//result.rows;
          for (var i = 0; i < result.rows.length; i++) {
            players[i] = result.rows[i].doc;
          }
          registeredPlayers = players;
          deferred.resolve(players);
        });
        return deferred.promise;
      }

      function findPlayerByName(playerName) {
          // TODO FILTER ON GET PLAYERS
          // $filter('filter')(array, expression, comparator)
          return getPlayers();
      }

      function findPlayerById(id) {
        // TODO FILTER ON GET PLAYERS
          return getPlayers();
      }

      function savePlayer(player) {
        var deferred = $q.defer();
        //var ACLs = User.acl();
        playersDb.put(player).then(
          function (savedPlayer) {
            deferred.resolve(savedPlayer);
          }
        );
        return deferred.promise;
      }

      function createPlayer(player) {
        var deferred = $q.defer();
        var toSave = new Player(player, userName, basePoints, defaultAvatar);
        console.log("Player ready to be saved : ");
        console.log(toSave);

        playersDb.post(toSave, function(error, result){
          deferred.resolve(result);
        });
        return deferred.promise;
      }

      function addPlayer(player) {
        return createPlayer(player);
        // // save games if player list changed
        // return saveGame(game);
      }

      function removePlayer(player) {
        if (player.id) {
          //TODO
          console.log("remove player" + player.id);
        }
      }

      function updatePlayer(player) {
        var deferred = $q.defer();
        //TODO
        console.log("update player" + player.id);
        deferred.resolve(player);
        return deferred.promise;
      }

      return {
        format: function() { return new Player },
        findByName: findPlayerByName,
        findById: findPlayerById,
        list: getPlayers,
        remove: removePlayer,
        add: addPlayer,
        update: updatePlayer
      };
    }];
  }]);
})();
