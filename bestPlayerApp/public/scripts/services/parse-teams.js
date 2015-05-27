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

        this.$get = ["$log", "$q", function ($log, $q) {

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

            function updateTeam(team) {
                var deferred = $q.defer();
                var query = new Parse.Query(parseTeam);
                query.get(team.id, {
                    success: function (savedTeam) {
                        savedTeam.save({
                            "rating":team.rating,
                            "gamesCount":team.gamesCount
                        }).then(function () {
                            deferred.resolve(prepareTeamToList(savedTeam))
                        });
                    },
                    error: function (error) {
                        //alert("Error: " + error.code + " " + error.message);
                        deferred.reject(error);
                    }
                });
                return deferred.promise;
            }

            function addTeam(teamName, playersIds) {
                var deferred = $q.defer();
                var team = angular.copy(teamFormat);
                team.name = teamName;

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
                "list": getTeams,
                "remove": removeTeam,
                "add": addTeam,
                "update": updateTeam
            };
        }];
    }]);
})();