/**
 * eloModule.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
    "use strict";
    angular.module("eloRating", []);
})();
/**
 * adapted-elo-rating.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
    "use strict";

    angular.module("eloRating").provider("AdaptedEloRating", [function () {
        // thanks to Chovanec.elo-rating github
        this.KFACTOR = 50;
        this.defaultRating = 1500;
        this.gapWeight = 10;
        this.goalBonus = 1; // points gain for every goal scored

        this.$get = ["$http", "$log", "$q", function ($http, $log, $q) {

            var KFACTOR = this.KFACTOR;
            var defaultRating = this.defaultRating;
            var gapWeight = this.gapWeight;
            var goalBonus = this.goalBonus;

            function getNewRatings(ratingA, ratingB, scoreA, scoreB, gamesCountA, gamesCountB) {

                var expectedScores = getExpectedScores(ratingA, ratingB);
                var expectedA = expectedScores["A"];
                var expectedB = expectedScores["B"];

                var newRatings = calculateNewRatings(ratingA, ratingB, expectedA, expectedB, scoreA, scoreB,
                    gamesCountA, gamesCountB);

                return {
                    "newRatings": newRatings, // new ranking number
                    "expectedResult": expectedScores // players cote %
                };
            }

            function getExpectedScores(ratingA, ratingB) {
                // cotes generator

                // add games count ?
                var expectedScoreA = 1 / ( 1 + ( Math.pow(10, ( ratingB - ratingA ) / 400) ) );
                var expectedScoreB = 1 / ( 1 + ( Math.pow(10, ( ratingA - ratingB ) / 400) ) );
                return {"A": expectedScoreA, "B": expectedScoreB};
            }

            function calculateNewRatings(ratingA, ratingB, expectedA, expectedB, scoreA, scoreB,
                                         gamesCountA, gamesCountB) {

                // transforming scores en 1 ou 0 pour respecter l'algo de base:
                var victoryA = (scoreA > scoreB) ? 1 : 0;
                var victoryB = (scoreB > scoreA) ? 1 : 0;

                // ajout de la prise en compte de l'écart entre les joueurs
                var ratingGap = ratingA - ratingB;
                var ratingGapPonderate = Math.abs(ratingGap / (KFACTOR / gapWeight));

                // ajouter la prise en compte du nombre de matchs joués
                var gamesGapA = gamesCountA - gamesCountB;
                var gamesGapB = gamesCountB - gamesCountA;
                //TODO

                // ajout du nombre de buts marqués
                var scoreBonusA = scoreA * (goalBonus);
                var scoreBonusB = scoreB * (goalBonus);

                var newRatingA, newRatingB;
                if (victoryA > 0 || victoryB > 0) {
                    // Not a draw
                    // on ajuste le nombre de points à gagner en fonction de l'écart entre les joueurs
                    newRatingA = ratingA + ( (KFACTOR + ratingGapPonderate) * ( victoryA - expectedA ));//* (1/expectedA));
                    newRatingB = ratingB + ( (KFACTOR + ratingGapPonderate) * ( victoryB - expectedB ));// * (1/expectedB));
                    newRatingA += scoreBonusA;
                    newRatingB += scoreBonusB;
                } else {
                    // draw match
                    // points gain is = to goalBonus mixed with chances of win, a very good player with a
                    // draw will win less points.
                    newRatingA = ratingA + (scoreBonusA*(1/expectedA));
                    newRatingB = ratingB + (scoreBonusB*(1/expectedB));
                }

                return {"A": newRatingA, "B": newRatingB};
            }

            return {
                "getNewRatings": getNewRatings,
                "scoreIsBool": false,
                "drawAble": true
            };
        }];
    }]);
})();
/**
 * chovanec-elo-rating.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function(){
    "use strict";

    angular.module("eloRating").provider("ChovanecEloRating", [function () {
        // thanks to Chovanec.elo-rating github
        this.KFACTOR = 16;

        this.$get = ["$http", "$log", "$q", function ($http, $log, $q) {

            // ELO Implementation from Chovanec/elo-rating github.
            var KFACTOR = this.KFACTOR;

            function getNewRatings(ratingA, ratingB, scoreA, scoreB) {

                var expectedScores = getExpectedScores(ratingA, ratingB);
                var expectedA = expectedScores["A"];
                var expectedB = expectedScores["B"];

                var newRatings = calculateNewRatings(ratingA, ratingB, expectedA, expectedB, scoreA, scoreB);

                return {
                    "newRatings": newRatings, // new ranking number
                    "expectedResult": expectedScores // players cote %
                };
            }

            function getExpectedScores(ratingA, ratingB) {
                var expectedScoreA = 1 / ( 1 + ( Math.pow(10, ( ratingB - ratingA ) / 400) ) );
                var expectedScoreB = 1 / ( 1 + ( Math.pow(10, ( ratingA - ratingB ) / 400) ) );
                return {"A": expectedScoreA, "B": expectedScoreB};
            }

            function calculateNewRatings(ratingA, ratingB, expectedA, expectedB, scoreA, scoreB) {
                var newRatingA = ratingA + ( KFACTOR * ( scoreA - expectedA ) );
                var newRatingB = ratingB + ( KFACTOR * ( scoreB - expectedB ) );
                return {"A": newRatingA, "B": newRatingB};
            }

            return {
                "getNewRatings": getNewRatings,
                "scoreIsBool": true,
                "drawAble": false
            };
        }];
    }]);
})();
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
/**
 * players.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
    "use strict";
    angular.module("players").provider("parsePlayersService", [function () {

        this.userName = "";
        this.basePoints = 1500;

        this.$get = ["$log", "$q", function ($log, $q) {

            var userName = this.userName;
            var basePoints = this.basePoints;
            var defaultAvatar = "app/assets/images/default-avatar.jpg";
            // PARSE
            var parsePlayer = Parse.Object.extend("player");

            var playerFormat = {
                "id": 0,
                "name": "",
                "rating": basePoints,
                "gamesCount": 0,
                "avatar": defaultAvatar,
                "username": userName,
                "nickname": ""
            };

            function preparePlayerToList(player) {
                var tmp = angular.copy(playerFormat);
                tmp.id = player.id;
                tmp.username = player.attributes.username;
                tmp.name = player.attributes.name;
                tmp.rating = player.attributes.rating;
                tmp.avatar = player.attributes.avatar;
                tmp.gamesCount = player.attributes.gamesCount;
                tmp.nickname = player.attributes.nickname;
                return tmp;
            }

            function getPlayers() {
                var deferred = $q.defer();
                var query = new Parse.Query(parsePlayer);
                query.equalTo("username", userName);
                query.find({
                    success: function (results) {
                        var players = [];
                        if (results.length > 0) {
                            for (var i = 0; i < results.length; i++) {
                                players[i] = preparePlayerToList(results[i]);
                            }
                        }
                        deferred.resolve(players);
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
            }

            /*
             function savePlayer(player) {
             var newPlayer = new parsePlayer();
             //var ACLs = User.acl();
             newPlayer.save({
             "username": userName,
             "name": player.name,
             "avatar": player.avatar,
             "rating": player.rating
             }
             ).then(
             function (savedPlayer) {
             deferred.resolve(preparePlayerToList(savedPlayer));
             }
             );
             }
             */

            function findPlayerByName(playerName) {
                var deferred = $q.defer();
                var qb = new Parse.Query(parsePlayer);
                var usernameQuery = qb.matches("username", userName);
                var query = Parse.Query.or(usernameQuery);
                query.limit(100);
                query.find({
                    success: function (results) {
                        if (results.length > 0) {
                            for (var i = 0; i < results.length; i++) {
                                if (results[i].attributes.name === playerName) {
                                    var player = preparePlayerToList(results[i]);
                                    deferred.resolve(player);
                                }
                            }
                            deferred.reject();
                        } else {
                            deferred.reject();
                        }
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
            }

            function findPlayerById(id) {
                var deferred = $q.defer();
                var query = new Parse.Query(parsePlayer);
                query.get(id, {
                    success: function (result) {
                        var player = preparePlayerToList(result);
                        deferred.resolve(player);
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
            }

            function updatePlayer(player) {
                var deferred = $q.defer();
                var query = new Parse.Query(parsePlayer);
                query.get(player.id, {
                    success: function (savedPlayer) {
                        savedPlayer.save({
                            "name": player.name,
                            "avatar": player.avatar,
                            "rating": player.rating,
                            "gamesCount": player.gamesCount,
                            "nickname": player.nickname
                        }).then(function () {
                            deferred.resolve(preparePlayerToList(savedPlayer));
                        });
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
            }

            function addPlayer(playerName) {
                var deferred = $q.defer();
                var player = angular.copy(playerFormat);
                player.name = playerName;

                var newPlayer = new parsePlayer();
                //var ACLs = User.acl();
                newPlayer.save({
                        "username": userName,
                        "name": playerName,
                        "avatar": defaultAvatar,
                        "rating": basePoints,
                        "gamesCount": 0,
                        "nickname": ""
                    }
                ).then(
                    function (savedPlayer) {
                        deferred.resolve(preparePlayerToList(savedPlayer));
                    }
                );
                return deferred.promise;
            }

            function removePlayer(player) {
                if (player.id) {
                    //TODO
                    console.log("remove player" + player.id);
                }
            }

            return {
                "format": angular.copy(playerFormat),
                "findByName": findPlayerByName,
                "findById": findPlayerById,
                "list": getPlayers,
                "remove": removePlayer,
                "add": addPlayer,
                "update": updatePlayer
            };
        }];
    }]);
})();

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

/**
 * teams.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
    "use strict";
    angular.module("teams", []);
    angular.module("teams").provider("localTeamsService", [function () {

        this.basePoints = 1500;

        this.$get = ["$log", function ($log) {

            var basePoints = this.basePoints;

            var teamFormat = {
                "id": 0,
                "name": "",
                "rating": basePoints,
                "gamesCount":0,
                "avatar":""
            };

            function getTeams() {
                var deferred = $q.defer();
                var stored = JSON.parse(localStorage.getItem("teams"));
                deferred.resolve(stored ? stored : []);
                return deferred.promise;
            }


            function saveTeams(teams) {
                var deferred = $q.defer();
                localStorage.setItem("teams", JSON.stringify(teams));
                deferred.resolve(teams);
                return deferred.promise;
            }

            function findTeamByName(name) {
                var deferred = $q.defer();
                var teams = getTeams();
                var teamIndex;
                var found = false;
                for (teamIndex in teams) {
                    if (teams[teamIndex] && teams[teamIndex].name) {
                        if (teams[teamIndex].name.indexOf(name) === 0 && teams[teamIndex].name === name) {
                            // team found, returning it.
                            found = true;
                            deferred.resolve(teams[teamIndex]);
                        }
                    }
                }
                if(!found){
                    deferred.reject();
                }
                // team not found return false
                return deferred.promise;
            }

            function findTeamById(id) {
                var deferred = $q.defer();
                var teams = getTeams();
                var teamIndex;
                var found = false;
                for (teamIndex in teams) {
                    if (teams[teamIndex] && teams[teamIndex].id) {
                        if (teams[teamIndex].id === id) {
                            // team found, returning it.
                            found = true;
                            deferred.resolve(teams[teamIndex]);
                        }
                    }
                }
                if(!found){
                    deferred.reject();
                }
                // team not found return false
                return deferred.promise;
            }




            function updateTeam(team, pointsGained) {
                var deferred = $q.defer();

                var teams = getTeams();
                var changed = false;
                // udpate teams
                // search teams in teams
                var teamIndex;
                for (teamIndex in teams) {
                    if (teams[teamIndex] && teams[teamIndex].id) {
                        if (teams[teamIndex].id === team.id) {
                            // team found, must be updated
                            teams[teamIndex] = team;
                            changed = true;
                        }
                    }
                }
                if (changed) {
                    // save updated teams
                    saveTeams(teams).then(function(teams){
                        deferred.resolve(teams);
                    });
                }
                return deferred.promise;
            }

            function addTeam(teamName) {
                var deferred = $q.defer();
                var teams = getTeams();
                var teamsCount = teams.length;
                var team = angular.copy(teamFormat);
                team.name = teamName;
                team.id = teamsCount + 1;

                teams.push(team);

                // save teams if team list changed
                if (teamsCount < teams.length) {
                    saveTeams(teams).then(function(teams){
                        deferred.resolve(team);
                        $log.info("team added");
                    });
                }
                return deferred.promise;
            }

            return {
                "format": angular.copy(teamFormat),
                "findByName": findTeamByName,
                "findById": findTeamById,
                "list": getTeams,
                "add": addTeam,
                "update": updateTeam
            };
        }];
    }]);
})();
/**
 * teams.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
    "use strict";
    angular.module("teams").provider("parseTeamsService", [function () {

        this.userName = "";
        this.basePoints = 1500;

        this.$get = ["$log", "$q", "pouchPlayersService", function ($log, $q, playerService) {

            var userName = this.userName;
            var basePoints = this.basePoints;
            var defaultAvatar = "app/assets/images/default-team-avatar.jpg";
            // PARSE
            var parseTeam = Parse.Object.extend("team");

            var teamFormat = {
                "id": 0,
                "name": "",
                "rating": basePoints,
                "gamesCount": 0,
                "avatar": defaultAvatar,
                "username": userName,
                "playersIds": []
            };

            function prepareTeamToList(team) {
                var tmp = angular.copy(teamFormat);
                tmp.id = team.id;
                tmp.username = team.attributes.username;
                tmp.name = team.attributes.name;
                tmp.rating = team.attributes.rating;
                tmp.avatar = team.attributes.avatar;
                tmp.gamesCount = team.attributes.gamesCount;
                tmp.playersIds = team.attributes.playersIds;
                return tmp;
            }

            function getTeams() {
                var deferred = $q.defer();
                var query = new Parse.Query(parseTeam);
                query.equalTo("username", userName);
                query.find({
                    success: function (results) {
                        var teams = [];
                        if (results.length > 0) {
                            for (var i = 0; i < results.length; i++) {
                                teams[i] = prepareTeamToList(results[i]);
                            }
                        }
                        deferred.resolve(teams);
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
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
                var deferred = $q.defer();
                var qb = new Parse.Query(parseTeam);
                var usernameQuery = qb.matches("username", userName);
                var query = Parse.Query.or(usernameQuery);
                query.limit(100);

                var playersIds = idsFromPlayers(players);

                query.find({
                    success: function (results) {
                        if (results.length > 0) {
                            playersIds = JSON.stringify(playersIds);
                            for (var i = 0; i < results.length; i++) {
                                if (JSON.stringify(results[i].attributes.playersIds) === playersIds) {
                                    var team = prepareTeamToList(results[i]);
                                    deferred.resolve(team);
                                    break;
                                }
                            }
                            deferred.reject();
                        } else {
                            deferred.reject();
                        }
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
            }

            function findTeamByName(teamName) {
                var deferred = $q.defer();
                var qb = new Parse.Query(parseTeam);
                var usernameQuery = qb.matches("username", userName);
                var query = Parse.Query.or(usernameQuery);
                query.limit(100);
                query.find({
                    success: function (results) {
                        if (results.length > 0) {
                            for (var i = 0; i < results.length; i++) {
                                if (results[i].attributes.name === teamName) {
                                    var team = prepareTeamToList(results[i]);
                                    deferred.resolve(team);
                                }
                            }
                            deferred.reject();
                        } else {
                            deferred.reject();
                        }
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
            }

            function findTeamById(id) {
                var deferred = $q.defer();
                var query = new Parse.Query(parseTeam);
                query.get(id, {
                    success: function (result) {
                        var team = prepareTeamToList(result);
                        deferred.resolve(team);
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
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
                var team = angular.copy(teamFormat);
                team.name = teamName;

                var playersIds = idsFromPlayers(players);

                var newTeam = new parseTeam;
                //var ACLs = User.acl();
                newTeam.save({
                        "username": userName,
                        "name": teamName,
                        "avatar": defaultAvatar,
                        "rating": basePoints,
                        "gamesCount": 0,
                        "playersIds": playersIds
                    }
                ).then(
                    function (savedTeam) {
                        deferred.resolve(prepareTeamToList(savedTeam));
                    }
                );
                return deferred.promise;
            }

            function removeTeam(team) {
                if (team.id) {
                    //TODO
                }
            }

            return {
                "format": angular.copy(teamFormat),
                "findByName": findTeamByName,
                "findById": findTeamById,
                "findByPlayers": findTeamByPlayers,
                "list": getTeams,
                "remove": removeTeam,
                "add": addTeam,
                "update": updateTeam
            };
        }];
    }]);
})();

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

/**
 * players.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function () {
    "use strict";
    angular.module("games", []);
    angular.module("games").provider("localGamesService", [function () {

        this.$get = ["$log", "$q", function ($log, $q) {

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

            function getGames() {
                var deferred = $q.defer();
                var stored = JSON.parse(localStorage.getItem("games"));
                deferred.resolve(stored ? stored : []);
                return deferred.promise;
            }


            function saveGames(games) {
                var deferred = $q.defer();
                localStorage.setItem("games", JSON.stringify(games));
                deferred.resolve(games);
                return deferred.promise;
            }

            function addGame(game) {
                var deferred = $q.defer();
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
                    saveGames(games).then(function (savedGames) {
                        $log.info("game added by service");
                        deferred.resolve(savedGames);
                    });
                }
                return deferred.promise;
            }

            /*
            function removeGame(game) {
                if (game.id) {
                    //TODO
                }
            }*/

            return {
                "format": angular.copy(gameFormat),
                "list": getGames,
                "save": saveGames,
                //"remove": removeGame,
                "add": addGame
            };
        }];
    }]);
})();
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
            var ParseGame = Parse.Object.extend("teamgame");

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
                var newGame = new ParseGame();
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

(function () {
    "use strict";

    // Parse.initialize("n3hvJCnz3q7egqqKq5QwPY0b64j5elVCV6WNdwZp", "Faixl3ZGd3cVgT205H2itrDIgyqmzyQZmxtrHKS1");


    angular.module("bestPlayerApp", [
        "ngMaterial",
        "eloRating",
        "players",
        "games",
        "teams"
    ]);

    angular.module("bestPlayerApp").config(["$mdThemingProvider", "pouchTeamgamesServiceProvider", "pouchPlayersServiceProvider", "pouchTeamsServiceProvider", function ($mdThemingProvider, gamesServiceProvider, playersServiceProvider, teamsServiceProvider) {
        $mdThemingProvider.theme("default")
            .primaryPalette("blue-grey")
            .accentPalette("brown")
            .warnPalette("deep-orange");

        var userName = "";
        if (window.location.hash.match(/^#(.*)/) && window.location.hash.match(/^#(.*)/).length > 1) {
            userName = window.location.hash.match(/^#(.*)/)[1];
        } else {
            userName = "default";
        }

        gamesServiceProvider.userName = userName;
        playersServiceProvider.userName = userName;
        teamsServiceProvider.userName = userName;

    }]);

    angular.module("bestPlayerApp").controller("AppCtrl", ["$scope", "$mdSidenav", function ($scope, $mdSidenav) {

        $scope.user = "default";
        if (window.location.hash.match(/^#(.*)/) && window.location.hash.match(/^#(.*)/).length > 1) {
            $scope.user = window.location.hash.match(/^#(.*)/)[1];
        } else {
            $scope.user = "default";
        }


        $scope.toggleSidenav = function (menuId) {
            $mdSidenav(menuId).toggle();
        };
    }]);

    angular.module("bestPlayerApp").directive("appContent", function () {

        var appContentDirectiveController = function ($scope, $log, $mdSidenav, $mdToast, $q, ratingService, playerService, gameService, teamService, $filter) {
            var self = this;

            self.username = gameService.username;
            self.games = [];
            self.players = [];
            self.teams = [];
            self.loading = true;
            self.newGame = {
                date: new Date(),
                playersA:[],
                playersB:[],
                scoreA:null,
                scoreB:null
            };

            self.playersOfTeams = {};

            self.addingGame = false;

            self.toggleTab = function () {
                $mdSidenav("left").toggle();
            };

            function getGames() {
                gameService.list().then(function (games) {
                    self.games = games;
                });
            }

            function getPlayers() {
                playerService.list().then(function (players) {
                    self.players = players;
                });
            }

            function getTeams() {
                teamService.list().then(function (teams) {
                    self.teams = teams;
                });
            }

            /**
             * Checks if the game form is valid.
             * @returns {boolean}
             */
            function gameIsValid() {
                var valid = true;
                if (self.newGame.playersA.length === 0) {
                    $log.error("not enough players in team A");
                    valid = false;
                }
                if (self.newGame.playersB.length === 0) {
                    $log.error("not enough players in team B");
                    valid = false;
                }
                if (typeof(parseInt(self.newGame.scoreA)) !== "number") {
                    $log.error("team A score not a number");
                    valid = false;
                }
                if (typeof(parseInt(self.newGame.scoreB)) !== "number") {
                    $log.error("team B score not a number");
                    valid = false;
                }
                if (!ratingService.drawAble) {
                    if (parseInt(self.newGame.scoreA) === parseInt(self.newGame.scoreB)) {
                        $log.error("team A score === team B score");
                        valid = false;
                    }
                }
                return valid;
            }

            /**
             *
             * @returns {string}
             */


            /**
             * Get a team from its players, or creates it.
             *
             * @param players
             * @returns {*}
             */
            function prepareTeam(players){
                var def = $q.defer();

                teamService.findByPlayers(players).then(function (team) {
                    def.resolve(team);
                }, function () {
                    teamService.add(randomTeamName(players), players).then(function (player) {
                        def.resolve(player);
                    });
                });
                return def.promise;
            }

            /**
             * get teams from names
             *
             * @param playersA
             * @param playersB
             * @returns {*}
             */
            function prepareTeams(playersA, playersB) {
                var preparePromise = $q.defer();
                var teamA;
                var teamB;

                var paPromise = $q.defer();
                var pbPromise = $q.defer();

                // prepare player A
                prepareTeam(playersA)
                    .then(function (teamAF) {
                        teamA = teamAF;
                        paPromise.resolve();
                    });

                paPromise.promise.then(function () {
                    // then prepare playerB
                    prepareTeam(playersB)
                        .then(function (teamBF) {
                            teamB = teamBF;
                            pbPromise.resolve();

                        });
                });

                pbPromise.promise.then(function () {
                    preparePromise.resolve({"A": teamA, "B": teamB});
                });

                return preparePromise.promise;
            }


            /**
             * returns score depending on rating service parameters
             * @param scoreA
             * @param scoreB
             * @returns {{A: Number, B: Number}}
             */
            function scoresForRating(scoreA, scoreB) {
                scoreA = parseInt(scoreA);
                scoreB = parseInt(scoreB);

                var scoreAForRating = scoreA;
                var scoreBForRating = scoreB;

                if (ratingService.scoreIsBool) {
                    var comp = parseInt(scoreA - scoreB);
                    scoreAForRating = (comp > 0) ? 1 : 0;
                    scoreBForRating = (comp < 0) ? 1 : 0;
                }
                return {"A": scoreAForRating, "B": scoreBForRating};
            }

            function prepareDate() {
                return self.newGame.date;
            }

            /**
             * prepares game object before saving, updates players
             *
             * @param playerA
             * @param playerB
             * @returns {{user: string, date: *, playerAExpectedVictory: boolean, playerAVictory: boolean, playerAId: (playerA.id|*), playerAName: (playerA.name|*), scoreA: Number, playerARatingBeforeGame: Number, playerARatingAfterGame: (playerA.rating|*), playerAQuotation: number, playerBId: (playerB.id|*), playerBName: (playerB.name|*), scoreB: Number, playerBRatingBeforeGame: Number, playerBRatingAfterGame: (playerB.rating|*), playerBQuotation: number}}
             */
            function prepareGameData(teamA, teamB) {
                var prepareGameDataPromise = $q.defer();
                var ratingA = parseInt(teamA.rating);
                var ratingB = parseInt(teamB.rating);

                var scoreA = parseInt(self.newGame.scoreA);
                var scoreB = parseInt(self.newGame.scoreB);

                var scores = scoresForRating(scoreA, scoreB);
                var scoreAForRating = scores.A;
                var scoreBForRating = scores.B;


                var newRatings = ratingService.getNewRatings(
                    ratingA,
                    ratingB,
                    scoreAForRating,
                    scoreBForRating,
                    teamA.gamesCount,
                    teamB.gamesCount
                );

                teamA.rating = newRatings.newRatings.A;
                teamB.rating = newRatings.newRatings.B;

                var teamAExpectedVictory = (newRatings.expectedResult.A > newRatings.expectedResult.B);

                var game = {
                    user: $scope.user,
                    date: prepareDate(),
                    teamAExpectedVictory: teamAExpectedVictory,
                    teamAVictory: (scoreA > scoreB),

                    teamAId: teamA.id,
                    scoreA: scoreA,
                    teamARatingBeforeGame: ratingA,
                    teamARatingAfterGame: teamA.rating,
                    teamAQuotation: Math.round((1 / newRatings.expectedResult.A) * 100) / 100,

                    teamBId: teamB.id,
                    scoreB: scoreB,
                    teamBRatingBeforeGame: ratingB,
                    teamBRatingAfterGame: teamB.rating,
                    teamBQuotation: Math.round((1 / newRatings.expectedResult.B) * 100) / 100
                };

                teamA.gamesCount += 1;
                teamB.gamesCount += 1;

                game.teamAPointsEarned = game.teamARatingAfterGame - game.teamARatingBeforeGame;
                game.teamBPointsEarned = game.teamBRatingAfterGame - game.teamBRatingBeforeGame;

                // update teams
                teamService.update(teamA, game.teamAPointsEarned).then(function () {
                    $log.debug("teamA saved");
                    teamService.update(teamB, game.teamBPointsEarned).then(function () {
                        $log.debug("teamB Saved");
                        // udpate teams list
                        getTeams();
                        getPlayers();
                        prepareGameDataPromise.resolve(game);
                    });
                });

                return prepareGameDataPromise.promise;
            }

            function searchPlayerByName(searchString) {
                return $filter("filter")(self.players, searchString);
            }

            /**
             * saves game form, updates players rankings, updates view,
             * @returns {boolean}
             */
            self.save = function () {

                self.addingGame = true;
                if (!gameIsValid()) {
                    return false;
                }

                var teamsPrepared;
                prepareTeams(self.newGame.playersA, self.newGame.playersB).then(function (teams) {
                    teamsPrepared = teams;

                    var teamA = teamsPrepared.A;
                    var teamB = teamsPrepared.B;

                    prepareGameData(teamA, teamB).then(function(game){
                        // store game :
                        gameService.add(game).then(function (newGame) {
                            game = newGame;
                            var gameLog = "Game [" + game.id + "], " + game.teamAId + " [" + game.teamARatingBeforeGame + "=>" + game.teamARatingAfterGame +
                                "], " + game.teamBId + " [" + game.teamBRatingBeforeGame + "=>" + game.teamARatingAfterGame + "]";

                            $log.debug(gameLog);

                            // update games list
                            getGames();
                            getPlayers();
                            getTeams();
                            self.addingGame = false;
                        });

                        // reset :
                        self.newGame = {
                            date: game.date,
                            playersA: [],
                            playersB: []
                        };
                    });
                });

            };

            self.loadAll = function () {
                getGames();
                getPlayers();
                getTeams();
            };

            $scope.refreshAll = self.loadAll;


            self.searchPlayer = function(playerName){
                self.playerSearched = playerName;
                return searchPlayerByName(playerName);
            };

            self.createPlayer = function (name) {
                playerService.add(name).then(function (newPlayer) {
                    self.playerSearched = "";
                    self.players.push(newPlayer);
                });
            };

            self.teamFromId = function(teamId){
                for(var i= 0;i<self.teams.length;i++){
                    if(teamId === self.teams[i].id){
                        return self.teams[i];
                    }
                }
            };

            self.playersOfTeam = function(teamId, playersIds){
                if(!playersIds){
                    return [];
                }
                if(self.playersOfTeams[teamId]){
                    return self.playersOfTeams[teamId];
                }
                var players = [];
                for(var i= 0;i < self.players.length;i++){
                    for(var j=0;j<playersIds.length;j++){
                        if(self.players[i] && playersIds[j] === self.players[i].id){
                            players.push(self.players[i]);
                        }
                        if(playersIds.length === players.length){
                            break;
                        }
                    }
                    if(playersIds.length === players.length){
                        break;
                    }
                }
                self.playersOfTeams[teamId] = players;
                return players;
            };


            self.teamFilter = function (team) {
                return team.playersIds.length >= 2;
            };
        };

        var appContentLink = function (scope, element, attrs, controller) {
            controller.loadAll();
            //controller.setFakeValues();

            controller.show = "list";

            scope.gamesShown = 10;
            scope.showMore = function () {
                scope.gamesShown += scope.gamesShown;
            };
            //console.log("appContent link executed");
            scope.mockAmount = 100;

            controller.newGame.date = new Date();
        };
        return {
            templateUrl: "views/app-content.html",
            replace: true,
            controllerAs: "appContent",
            controller: ["$scope", "$log", "$mdSidenav", "$mdToast", "$q", "AdaptedEloRating", "pouchPlayersService", "pouchTeamgamesService", "pouchTeamsService", "$filter", appContentDirectiveController],
            link: appContentLink
        };
    });

})();

(function () {
  "use strict";

  angular.module("bestPlayerApp").directive("testContent", function () {
    var testContentDirectiveController = function ($scope, $log, $mdSidenav, $mdToast,
      $q, ratingService, playerService, teamgameService, teamService, $filter) {
    var self = this;

    self.username = teamgameService.username;
    self.games = [];
    self.players = [];
    self.teams = [];
    self.loading = true;
    self.newGame = {
        date: new Date(),
        playersA:[],
        playersB:[],
        scoreA:null,
        scoreB:null
    };

    self.newPlayer = playerService.format();

    self.playersOfTeams = {};

    self.addingGame = false;

    self.toggleTab = function () {
        $mdSidenav("left").toggle();
    };

    function getGames() {
        teamgameService.list().then(function (games) {
            self.games = games;
        });
    }

    function getPlayers() {
        playerService.list().then(function (players) {
            self.players = players;
        });
    }

    function getTeams() {
        teamService.list().then(function (teams) {
            self.teams = teams;
        });
    }

    /**
     * Checks if the game form is valid.
     * @returns {boolean}
     */
    function gameIsValid() {
        var valid = true;
        if (self.newGame.playersA.length === 0) {
            $log.error("not enough players in team A");
            valid = false;
        }
        if (self.newGame.playersB.length === 0) {
            $log.error("not enough players in team B");
            valid = false;
        }
        if (typeof(parseInt(self.newGame.scoreA)) !== "number") {
            $log.error("team A score not a number");
            valid = false;
        }
        if (typeof(parseInt(self.newGame.scoreB)) !== "number") {
            $log.error("team B score not a number");
            valid = false;
        }
        if (!ratingService.drawAble) {
            if (parseInt(self.newGame.scoreA) === parseInt(self.newGame.scoreB)) {
                $log.error("team A score === team B score");
                valid = false;
            }
        }
        return valid;
    }

    /**
     *
     * @returns {string}
     */
    function randomTeamName(players){
        if(players.length === 1){
            return players[0].name;
        }else{
            var names = [
                "toffee","croissant", "oat","cake", "gummies", "ice", "cream", "danish",
                "jellybeans", "macaroon", "candy", "wafer", "sesame",
                "snaps", "pie", "danish", "chupa chups", "chocolate bar", "cotton",
                "candy", "sweet", "cheesecake", "ice", "cream", "jelly",
                "brownie", "souffle", "carrot cake", "toffee", "ice cream", "icing", "bear",
                "claw", "cookie", "topping", "claw", "pastry", "lollipop", "topping","ham","fine","ugly","fast",
                "jaws","bag","sky","team","soldiers", "pizza", "water", "beer", "foot", "head"
            ];

            var a = Math.floor(Math.random() * names.length);
            var b = Math.floor(Math.random() * names.length);

            return names[a].charAt(0).toUpperCase() + names[a].substr(1) +" "+ names[b];
        }
    }

    /**
     * Get a team from its players, or creates it.
     *
     * @param players
     * @returns {*}
     */
    function prepareTeam(players){
        var def = $q.defer();

        teamService.findByPlayers(players).then(function (team) {
            def.resolve(team);
        }, function () {
            teamService.add(randomTeamName(players), players).then(function (player) {
                def.resolve(player);
            });
        });
        return def.promise;
    }

    /**
     * get teams from names
     *
     * @param playersA
     * @param playersB
     * @returns {*}
     */
    function prepareTeams(playersA, playersB) {
        var preparePromise = $q.defer();
        var teamA;
        var teamB;

        var paPromise = $q.defer();
        var pbPromise = $q.defer();

        // prepare player A
        prepareTeam(playersA)
            .then(function (teamAF) {
                teamA = teamAF;
                paPromise.resolve();
            });

        paPromise.promise.then(function () {
            // then prepare playerB
            prepareTeam(playersB)
                .then(function (teamBF) {
                    teamB = teamBF;
                    pbPromise.resolve();

                });
        });

        pbPromise.promise.then(function () {
            preparePromise.resolve({"A": teamA, "B": teamB});
        });

        return preparePromise.promise;
    }


    /**
     * returns score depending on rating service parameters
     * @param scoreA
     * @param scoreB
     * @returns {{A: Number, B: Number}}
     */
    function scoresForRating(scoreA, scoreB) {
        scoreA = parseInt(scoreA);
        scoreB = parseInt(scoreB);

        var scoreAForRating = scoreA;
        var scoreBForRating = scoreB;

        if (ratingService.scoreIsBool) {
            var comp = parseInt(scoreA - scoreB);
            scoreAForRating = (comp > 0) ? 1 : 0;
            scoreBForRating = (comp < 0) ? 1 : 0;
        }
        return {"A": scoreAForRating, "B": scoreBForRating};
    }

    function prepareDate() {
        return self.newGame.date;
    }

    /**
     * prepares game object before saving, updates players
     *
     * @param playerA
     * @param playerB
     * @returns {{user: string, date: *, playerAExpectedVictory: boolean, playerAVictory: boolean, playerAId: (playerA.id|*), playerAName: (playerA.name|*), scoreA: Number, playerARatingBeforeGame: Number, playerARatingAfterGame: (playerA.rating|*), playerAQuotation: number, playerBId: (playerB.id|*), playerBName: (playerB.name|*), scoreB: Number, playerBRatingBeforeGame: Number, playerBRatingAfterGame: (playerB.rating|*), playerBQuotation: number}}
     */
    function prepareGameData(teamA, teamB) {
      var prepareGameDataPromise = $q.defer();
      var ratingA = parseInt(teamA.rating);
      var ratingB = parseInt(teamB.rating);

      var scoreA = parseInt(self.newGame.scoreA);
      var scoreB = parseInt(self.newGame.scoreB);

      var scores = scoresForRating(scoreA, scoreB);
      var scoreAForRating = scores.A;
      var scoreBForRating = scores.B;


      var newRatings = ratingService.getNewRatings(
        ratingA,
        ratingB,
        scoreAForRating,
        scoreBForRating,
        teamA.gamesCount,
        teamB.gamesCount
      );

      teamA.rating = newRatings.newRatings.A;
      teamB.rating = newRatings.newRatings.B;

      var teamAExpectedVictory = (newRatings.expectedResult.A > newRatings.expectedResult.B);

      var game = {
        user: $scope.user,
        date: prepareDate(),
        teamAExpectedVictory: teamAExpectedVictory,
        teamAVictory: (scoreA > scoreB),

        teamAId: teamA.id,
        scoreA: scoreA,
        teamARatingBeforeGame: ratingA,
        teamARatingAfterGame: teamA.rating,
        teamAQuotation: Math.round((1 / newRatings.expectedResult.A) * 100) / 100,

        teamBId: teamB.id,
        scoreB: scoreB,
        teamBRatingBeforeGame: ratingB,
        teamBRatingAfterGame: teamB.rating,
        teamBQuotation: Math.round((1 / newRatings.expectedResult.B) * 100) / 100
      };

      teamA.gamesCount += 1;
      teamB.gamesCount += 1;

      game.teamAPointsEarned = game.teamARatingAfterGame - game.teamARatingBeforeGame;
      game.teamBPointsEarned = game.teamBRatingAfterGame - game.teamBRatingBeforeGame;

      // update teams
      teamService.update(teamA, game.teamAPointsEarned).then(function () {
        $log.debug("teamA saved");
        teamService.update(teamB, game.teamBPointsEarned).then(function () {
          $log.debug("teamB Saved");
          // udpate teams list
          getTeams();
          getPlayers();
          prepareGameDataPromise.resolve(game);
        });
      });

      return prepareGameDataPromise.promise;
    }

    function searchPlayerByName(searchString) {
      return $filter("filter")(self.players, searchString);
    }

    self.saveNewPlayer = function() {
      console.log('saveNewPlayer');
      console.log(self.newPlayer);
      playerService.add(self.newPlayer)
      getPlayers();
      self.newPlayer = playerService.format();
    }

    /**
     * saves game form, updates players rankings, updates view,
     * @returns {boolean}
     */
    self.save = function () {

      self.addingGame = true;
      if (!gameIsValid()) {
        return false;
      }

      var teamsPrepared;
      prepareTeams(self.newGame.playersA, self.newGame.playersB).then(function (teams) {
        teamsPrepared = teams;

        var teamA = teamsPrepared.A;
        var teamB = teamsPrepared.B;

        prepareGameData(teamA, teamB).then(function(game){
          // store game :
          teamgameService.add(game).then(function (newGame) {
            game = newGame;
            var gameLog = "Game [" + game.id + "], " + game.teamAId + " [" + game.teamARatingBeforeGame + "=>" + game.teamARatingAfterGame +
                "], " + game.teamBId + " [" + game.teamBRatingBeforeGame + "=>" + game.teamARatingAfterGame + "]";

            $log.debug(gameLog);

            // update games list
            getGames();
            getPlayers();
            getTeams();
            self.addingGame = false;
          });

          // reset :
          self.newGame = {
            date: game.date,
            playersA: [],
            playersB: []
          };
        });
      });

    };

    self.loadAll = function () {
      getGames();
      getPlayers();
      getTeams();
    };

    $scope.refreshAll = self.loadAll;


    self.searchPlayer = function(playerName){
      self.playerSearched = playerName;
      return searchPlayerByName(playerName);
    };

    self.createPlayer = function (name) {
      playerService.add(name).then(function (newPlayer) {
        self.playerSearched = "";
        self.players.push(newPlayer);
      });
    };

    self.teamFromId = function(teamId){
      for(var i= 0;i<self.teams.length;i++){
        if(teamId === self.teams[i].id){
          return self.teams[i];
        }
      }
    };

    self.playersOfTeam = function(teamId, playersIds){
      if(!playersIds){
        return [];
      }
      if(self.playersOfTeams[teamId]){
        return self.playersOfTeams[teamId];
      }
      var players = [];
      for(var i= 0;i < self.players.length;i++){
        for(var j=0;j<playersIds.length;j++){
          if(self.players[i] && playersIds[j] === self.players[i].id){
            players.push(self.players[i]);
          }
          if(playersIds.length === players.length){
            break;
          }
        }
        if(playersIds.length === players.length){
          break;
        }
      }
      self.playersOfTeams[teamId] = players;
      return players;
    };


    self.teamFilter = function (team) {
      return team.playersIds.length >= 2;
    };

    self.simulateAddGame = function() {
      var game = teamgameService.format();
      teamgameService.add(game).then(
        function(){
          getGames();
        }
      );
    }
  };

  var testContentLink = function (scope, element, attrs, controller) {
      controller.loadAll();
      //controller.setFakeValues();

      controller.show = "list";

      scope.gamesShown = 10;
      scope.showMore = function () {
          scope.gamesShown += scope.gamesShown;
      };
      //console.log("appContent link executed");
      scope.mockAmount = 100;

      controller.newGame.date = new Date();
  };
  return {
      templateUrl: "views/test-content.html",
      replace: true,
      controllerAs: "testContent",
      controller: ["$scope", "$log", "$mdSidenav", "$mdToast", "$q",
      "AdaptedEloRating", "pouchPlayersService", "pouchTeamgamesService",
      "pouchTeamsService", "$filter", testContentDirectiveController],
      link: testContentLink
    };
  });
})();

/**
 * import-files.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function(){
    "use script";
    angular.module("bestPlayerApp").directive("importGeneratedData", function(){
        function controller($scope, $http, playerService, gamesService){
            self = this;
            var files = [
                {"name":"Digitaleo","url":"/tests_results/digitaleo.json"},
                {"name":"D3,grpA,2014-2015 sans dates","url":"/tests_results/france_d3_2014-15-111d33e.json"},
                {"name":"D3,grpA,2014-2015 avec dates","url":"/tests_results/france_d3_2014-15-5a7b4d4.json"}
            ];

            self.files = files;

            self.setData = function(id){
               if(files[id]){
                   $http.get(files[id].url).then(function(response){
                       fileContent = response.data;
                       gamesService.save(fileContent.games);
                       playerService.save(fileContent.players);
                       $scope.refreshAll();
                   });
               }
            };
        }

        function link(scope, element, attrs, controller){
            scope.files = controller.files;
        }
        return {
            templateUrl: '/views/import-generated-data.html',
            replace: true,
            transclude: true,
            controller: ["$scope","$http", "localPlayersService", "localGamesService", controller],
            controllerAs: 'importFiles',
            link:link
        };
    });
})();