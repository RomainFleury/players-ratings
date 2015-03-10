(function () {
    "use strict";

    Parse.initialize("");


    angular.module("bestPlayerApp", [
        "ngTouch",
        "ngMaterial",
        "eloRating",
        "players",
        "games"
    ]);

    angular.module("bestPlayerApp").config(["$mdThemingProvider", "parseGamesServiceProvider", "parsePlayersServiceProvider", function ($mdThemingProvider, gamesServiceProvider, playersServiceProvider) {
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

        var appContentDirectiveController = function ($scope, $http, $log, $mdSidenav, $mdToast, $q, ratingService, playerService, gameService) {
            var self = this;

            self.games = [];
            self.players = [];
            self.loading = true;
            self.newGame = {date: new Date()};

            self.toggleTab = function () {
                $mdSidenav("left").toggle();
            };

            function getGames() {
                gameService.list().then(function(games){
                    self.games = games;
                });
            }

            function getPlayers() {
                playerService.list().then(function(players){
                    self.players = players;
                });
            }

            function gameIsValid() {
                var valid = true;
                if (self.newGame.playerAName.length === 0) {
                    $log.error("player A name empty");
                    valid = false;
                }
                if (self.newGame.playerBName.length === 0) {
                    $log.error("player B name empty");
                    valid = false;
                }
                if (typeof(parseInt(self.newGame.scoreA)) !== "number") {
                    $log.error("player A score not a number");
                    valid = false;
                }
                if (typeof(parseInt(self.newGame.scoreB)) !== "number") {
                    $log.error("player B score not a number");
                    valid = false;
                }
                if (!ratingService.drawAble) {
                    if (parseInt(self.newGame.scoreA) === parseInt(self.newGame.scoreB)) {
                        $log.error("player A score === player B score");
                        valid = false;
                    }
                }
                return valid;
            }

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

                paPromise.promise.then(function(){
                    // then prepare playerB
                    preparePlayer(playerBName)
                        .then(function (playerBF) {
                            playerB = playerBF;
                            pbPromise.resolve();

                        });
                });

                pbPromise.promise.then(function(){
                    preparePromise.resolve({"A": playerA, "B": playerB});
                });

                return preparePromise.promise;
            }

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

            function prepareGameData(playerA, playerB){
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
                playerService.update(playerA).then(function(){
                    playerService.update(playerB).then(function(){
                        // udpate players list
                        getPlayers();
                    });
                });


                return game;
            }

            self.save = function () {

                if (!gameIsValid()) {
                    return false;
                }

                var playersPrepared;
                preparePlayers(self.newGame.playerAName.trim(), self.newGame.playerBName.trim()).then(function(players){
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
                        //self.games = getGames();
                        getGames()
                    });

                    // reset :
                    self.newGame = {
                        date: game.date
                    };


                });

            };

            self.setFakeValues = function () {
                var sA = Math.round((Math.random() * 10) / 2);
                var sB = Math.round((Math.random() * 10) / 2);
                if (sA === sB && ratingService.scoreIsBool) {
                    sA += 1;
                }

                var nA = Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 1).toUpperCase();
                var nB = Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 1).toUpperCase();

                // Nom des joueurs qui jouent beaucoup
                var mnA = "Rennes";
                var mnB = "Nantes";

                var mockTeams = {
                    "A": "Brest",
                    "B": "Bordeaux",
                    "C": "La Roche sur Yon",
                    "D": "Orléans",
                    "E": "Tours",
                    "F": "Poitiers"
                };

                nA = mockTeams[nA] ? mockTeams[nA] : nA;
                nB = mockTeams[nB] ? mockTeams[nB] : nB;


                nA = nA.replace(/^[G-Z]{1}$/g, mnA);
                nB = nB.replace(/[G-Z]{1}$/g, mnB);
                if (nA === nB) {
                    nA = mnA;
                    nB = mnB;
                }

                self.newGame = {
                    "playerAName": nA,
                    "scoreA": sA,
                    "scoreB": sB,
                    "playerBName": nB
                };
            };

            self.resetAll = function () {
                localStorage.setItem("games", "[]");
                localStorage.setItem("players", "[]");
                self.games = [];
                self.players = [];
            };

            self.loadAll = function () {
                getGames();
                getPlayers();
//                getPlayers().then(function(players){self.players = players});
//                self.games = getGames();
            };

            $scope.refreshAll = self.loadAll;

            self.mockGames = function (count) {
                $scope.generating = true;
                var timer = "Mock " + count + " games";
                var start;
                var end;
                if (window.performance) {
                    start = window.performance.now();
                } else {
                    start = new Date().getTime();
                }
                console.time(timer);
                var initialCount = parseInt(self.games.length);
                while (self.games.length < (initialCount + count)) {
                    if (!self.playerAName) {
                        self.setFakeValues();
                    }
                    self.save();
                }
                console.timeEnd(timer);
                if (window.performance) {
                    end = window.performance.now();
                } else {
                    end = new Date().getTime();
                }

                $mdToast.show(
                    $mdToast.simple()
                        .content(count + " games generated in " + Math.round(end - start) + " ms.")
                        .position("bottom right")
                        .hideDelay(3000)
                );
                $scope.generating = false;

                //$log.info("games : " + self.games.length);
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
            controller: ["$scope", "$http", "$log", "$mdSidenav", "$mdToast", "$q", "AdaptedEloRating", "parsePlayersService", "parseGamesService", appContentDirectiveController],
            link: appContentLink
        };
    });

})();