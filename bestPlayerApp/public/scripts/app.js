(function () {
    "use strict";

    Parse.initialize("n3hvJCnz3q7egqqKq5QwPY0b64j5elVCV6WNdwZp", "Faixl3ZGd3cVgT205H2itrDIgyqmzyQZmxtrHKS1");


    angular.module("bestPlayerApp", [
        "ngTouch",
        "ngMaterial",
        "eloRating",
        "players",
        "games",
        "teams"
    ]);

    angular.module("bestPlayerApp").config(["$mdThemingProvider", "parseTeamgamesServiceProvider", "parsePlayersServiceProvider", "parseTeamsServiceProvider", function ($mdThemingProvider, gamesServiceProvider, playersServiceProvider, parseTeamsServiceProvider) {
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
        parseTeamsServiceProvider.userName = userName;

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

        var appContentDirectiveController = function ($scope, $http, $log, $mdSidenav, $mdToast, $q, ratingService, playerService, gameService, teamService, $filter) {
            var self = this;

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
             * Get a player from his name, or creates it.
             *
             * @param playerName
             * @returns {*}
             */
            function preparePlayer(playerName) {
                var def = $q.defer();

                playerService.findByName(playerName).then(function (player) {
                    def.resolve(player);
                }, function () {
                    playerService.add(playerName).then(function (player) {
                        def.resolve(player);
                    });
                });
                return def.promise;
            }

            /**
             *
             * @returns {string}
             */
            function randomTeamName(){
                var names = [
                    "toffee","croissant", "oat","cake", "gummies", "ice", "cream", "danish",
                    "jellybeans", "Macaroon", "candy", "wafer", "sesame",
                    "snaps", "pie", "danish", "chupa chups", "chocolate bar", "cotton",
                    "candy", "sweet", "cheesecake", "ice", "cream", "jelly-o","jujubes",
                    "brownie", "soufflé", "carrot cake", "toffee", "ice cream", "icing", "bear",
                    "claw", "cookie", "topping", "claw", "pastry", "lollipop", "topping","ham","fine","ugly","fast",
                    "jawbone","bag","sky","team","soldiers"
                ];

                var a = Math.floor(Math.random() * names.length);
                var b = Math.floor(Math.random() * names.length);

                return names[a].charAt(0).toUpperCase() + names[a].substr(1) +' '+ names[b];
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
                    teamService.add(randomTeamName(), players).then(function (player) {
                        def.resolve(player);
                    });
                });
                return def.promise;
            }

            /**
             * get players from names
             *
             * @param playerAName
             * @param playerBName
             * @returns {*}
             */
            function preparePlayers(playerAName, playerBName) {
                var preparePromise = $q.defer();
                var playerA;
                var playerB;

                var paPromise = $q.defer();
                var pbPromise = $q.defer();

                // prepare player A
                preparePlayer(playerAName)
                    .then(function (playerAF) {
                        playerA = playerAF;
                        paPromise.resolve();
                    });

                paPromise.promise.then(function () {
                    // then prepare playerB
                    preparePlayer(playerBName)
                        .then(function (playerBF) {
                            playerB = playerBF;
                            pbPromise.resolve();

                        });
                });

                pbPromise.promise.then(function () {
                    preparePromise.resolve({"A": playerA, "B": playerB});
                });

                return preparePromise.promise;
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
            function prepareGameData(playerA, playerB) {
                var ratingA = parseInt(playerA.rating);
                var ratingB = parseInt(playerB.rating);

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
                    playerA.gamesCount,
                    playerB.gamesCount
                );

                playerA.rating = newRatings.newRatings.A;
                playerB.rating = newRatings.newRatings.B;

                var playerAExpectedVictory = (newRatings.expectedResult.A > newRatings.expectedResult.B);

                var game = {
                    user: $scope.user,
                    date: prepareDate(),
                    playerAExpectedVictory: playerAExpectedVictory,
                    playerAVictory: (scoreA > scoreB),

                    playerAId: playerA.id,
                    playerAName: playerA.name,
                    scoreA: scoreA,
                    playerARatingBeforeGame: ratingA,
                    playerARatingAfterGame: playerA.rating,
                    playerAQuotation: Math.round((1 / newRatings.expectedResult.A) * 100) / 100,

                    playerBId: playerB.id,
                    playerBName: playerB.name,
                    scoreB: scoreB,
                    playerBRatingBeforeGame: ratingB,
                    playerBRatingAfterGame: playerB.rating,
                    playerBQuotation: Math.round((1 / newRatings.expectedResult.B) * 100) / 100
                };

                playerA.gamesCount += 1;
                playerB.gamesCount += 1;

                // update players
                playerService.update(playerA).then(function () {
                    playerService.update(playerB).then(function () {
                        // udpate players list
                        getPlayers();
                    });
                });

                return game;
            }

            function searchPlayerByName(searchString) {
                return $filter("filter")(self.players, searchString);
            }

            /**
             * saves game form, updates players rankings, updates view,
             * @returns {boolean}
             */
            self.save = function () {

                if (!gameIsValid()) {
                    return false;
                }

                var playersPrepared;
                preparePlayers(self.newGame.playerAName.trim(), self.newGame.playerBName.trim()).then(function (players) {
                    playersPrepared = players;

                    var playerA = playersPrepared.A;
                    var playerB = playersPrepared.B;

                    var game = prepareGameData(playerA, playerB);

                    // store game :
                    gameService.add(game).then(function (newGame) {
                        game = newGame;
                        var gameLog = "Game [" + game.id + "], " + game.playerAName + " [" + game.playerARatingBeforeGame + "=>" + game.playerARatingAfterGame +
                            "], " + game.playerBName + " [" + game.playerBRatingBeforeGame + "=>" + game.playerARatingAfterGame + "]";

                        $log.debug(gameLog);

                        // update games list
                        getGames();
                    });

                    // reset :
                    self.newGame = {
                        date: game.date
                    };


                });

            };

            self.resetAll = function () {
                localStorage.setItem("games", "[]");
                localStorage.setItem("players", "[]");
                localStorage.setItem("teams", "[]");
                self.games = [];
                self.players = [];
                self.teams = [];
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
                    getPlayers();
                    //$scope.$digest();
                });
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
            controller: ["$scope", "$http", "$log", "$mdSidenav", "$mdToast", "$q", "AdaptedEloRating", "parsePlayersService", "parseTeamgamesService", "parseTeamsService", "$filter", appContentDirectiveController],
            link: appContentLink
        };
    });

})();