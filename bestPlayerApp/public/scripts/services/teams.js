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

            function updateTeam(team) {
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