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

        this.$get = ["$log", "$q", "parsePlayersService", function ($log, $q, playerService) {

            var userName = this.userName;
            var basePoints = this.basePoints;
            var defaultAvatar = "/images/default-team-avatar.jpg";
            // PARSE
            var parseTeam = Parse.Object.extend("team");

            var teamFormat = {
                "id": 0,
                "name": "",
                "rating": basePoints,
                "gamesCount": 0,
                "avatar": defaultAvatar,
                "username": userName,
                "playersIds":[]
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
            function idsFromPlayers(players){
                var playersIds = [];
                for(var p=0;p<players.length;p++){
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

            function updatePlayers(playersIds, totalTeamPointsGained){
                $log.debug("UPDATE PLAYERS, ids");
                $log.debug(playersIds);
                $log.debug("totalTeamPointsGained");
                $log.debug(totalTeamPointsGained);
                var deferred = $q.defer();
                if(playersIds.length <= 0){
                    $log.error("players empty in a team ? WTF ?");
                    throw new EventException();
                }
                var pointsPerPlayer = (totalTeamPointsGained / playersIds.length);

                for(var i= 0; i < playersIds.length; i++){
                    debugger;
                    playerService.findById(playersIds[i]).then(function(player){
                        debugger;
                        player.gamesCount += 1;
                        player.rating += pointsPerPlayer;
                        playerService.update(player).then(function(){
                            debugger;
                            if((i+1) >= playersIds.length){
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
                            "name":team.name,
                            "rating":team.rating,
                            "avatar":team.avatar,
                            "gamesCount":team.gamesCount
                        }).then(function (savedTeam) {
                            $log.debug("team saved, update players");
                            updatePlayers(team.playersIds, pointsGained).then(
                                function(){
                                    updateFinishedPromise.resolve(prepareTeamToList(savedTeam));
                                },
                                function(fail){
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
                        "gamesCount":0,
                        "playersIds":playersIds
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