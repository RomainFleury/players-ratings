(function () {
    "use strict";
    angular.module("bestPlayerApp", [
        "ngMaterial",
        "eloRating",
        "players",
        "games"
    ]);

    angular.module("bestPlayerApp").config(['$mdThemingProvider', function($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue-grey')
            .accentPalette('brown')
            .warnPalette('deep-orange');
    }]);

    angular.module("bestPlayerApp").controller("AppCtrl", ["$scope", "$mdSidenav", function ($scope, $mdSidenav) {
        $scope.toggleSidenav = function (menuId) {
            $mdSidenav(menuId).toggle();
        };
    }]);

    angular.module("bestPlayerApp").directive("appContent", function () {

        var appContentDirectiveController = function ($scope, $http, $log, $mdSidenav, $mdToast, ratingService, playerService, gameService) {
            var self = this;

            self.games = [];
            self.players = [];
            self.loading = true;
            self.newGame = {};

            self.toggleTab = function () {
                $mdSidenav("left").toggle();
            };

            function getGames() {
                return gameService.list();
            }

            function getPlayers(){
                return playerService.list();
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
                if (parseInt(self.newGame.scoreA) === parseInt(self.newGame.scoreB)) {
                    $log.error("player A score === player B score");
                    valid = false;
                }
                return valid;
            }

            self.save = function () {

                if (!gameIsValid()) {
                    return false;
                }

                var playerA;
                var playerB;

                var playerAName = self.newGame.playerAName.trim();
                var playerBName = self.newGame.playerBName.trim();

                // search players in players
                playerA = playerService.findByName(playerAName);
                playerB = playerService.findByName(playerBName);

                // create players if required
                if (!playerA) {
                    playerA = playerService.add(playerAName);
                }
                if (!playerB) {
                    playerB = playerService.add(playerBName);
                }

                var ratingA = parseInt(playerA.rating);
                var ratingB = parseInt(playerB.rating);

                var scoreA = parseInt(self.newGame.scoreA);
                var scoreB = parseInt(self.newGame.scoreB);

                var scoreAForRating = parseInt(scoreA);
                var scoreBForRating = parseInt(scoreB);

                if (ratingService.scoreIsBool) {
                    var comp = parseInt(scoreA - scoreB);
                    scoreAForRating = (comp > 0) ? 1 : 0;
                    scoreBForRating = (comp < 0) ? 1 : 0;
                }

                var gamesCountA = playerA.gamesCount;
                var gamesCountB = playerB.gamesCount;

                var newRatings = ratingService.getNewRatings(
                    ratingA,
                    ratingB,
                    scoreAForRating,
                    scoreBForRating,
                    gamesCountA,
                    gamesCountB
                );

                playerA.rating = newRatings.newRatings.A;
                playerB.rating = newRatings.newRatings.B;

                var playerAExpectedVictory = (newRatings.expectedResult.A > newRatings.expectedResult.B);

                var game = {
                    playerAExpectedVictory: playerAExpectedVictory,
                    playerAVictory: (scoreA > scoreB),

                    playerAId: playerA.id,
                    playerAName: playerA.name,
                    scoreA: scoreA,
                    playerARatingBeforeGame: ratingA,
                    playerARatingAfterGame: playerA.rating,
                    playerAQuotation: Math.round((1/newRatings.expectedResult.A)*100)/100,

                    playerBId: playerB.id,
                    playerBName: playerB.name,
                    scoreB: scoreB,
                    playerBRatingBeforeGame: ratingB,
                    playerBRatingAfterGame: playerB.rating,
                    playerBQuotation: Math.round((1/newRatings.expectedResult.B)*100)/100
                };

                // store game :
                game = gameService.add(game);
                var gameLog = "Game [" + game.id + "], " + playerA.name + " [" + ratingA + "=>" + playerA.rating + "], "
                    + playerB.name + " [" + ratingB + "=>" + playerB.rating + "]";

                $log.debug(gameLog);

                // update games list
                self.games = getGames();

                playerA.gamesCount += 1;
                playerB.gamesCount += 1;

                playerService.update(playerA);
                playerService.update(playerB);
                // udpate players list
                self.players = getPlayers();

                // reset :
                self.newGame = {};
                //self.setFakeValues();
            };

            self.setFakeValues = function () {
                var sA = Math.round((Math.random() * 10) / 2);
                var sB = Math.round((Math.random() * 10) / 2);
                if (sA === sB) sA += 1;

                var nA = Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 1).toUpperCase();
                var nB = Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 1).toUpperCase();

                // Nom des joueurs qui jouent beaucoup
                var mnA = "Cormorans";
                var mnB = "Corsaires";

                var mockTeams = {
                    "A":"Albatros",
                    "B":"Boxers",
                    "C":"Hogly",
                    "D":"Renards",
                    "E":"Remparts",
                    "F":"Dragons",
                    "G":"Castors",
                    "H":"Coqs",
                    "I":"Jokers"
                };

                nA = mockTeams[nA]?mockTeams[nA]:nA;
                nB = mockTeams[nB]?mockTeams[nB]:nB;


                nA = nA.replace(/^[J-Z]{1}$/g, mnA);
                nB = nB.replace(/[J-Z]{1}$/g, mnB);
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
                self.games = getGames();
                self.players = getPlayers();
            };


            self.mockGames = function (count) {
                $scope.generating = true;
                var timer = "Mock " + count + " games";
                var start;
                var end;
                if(window.performance){
                    start = window.performance.now();
                }else{
                    var d1 = new Date();
                    start = d1.getTime();
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
                if(window.performance){
                    end = window.performance.now();
                }else{
                    var d2 = new Date();
                    end = d2.getTime();
                }

                $mdToast.show(
                    $mdToast.simple()
                        .content(count + " games generated in " + Math.round(end - start) + " ms.")
                        .position("bottom right")
                        .hideDelay(3000)
                );
                $scope.generating = false;

                //$log.info("games : " + self.games.length);
            }
        };

        var appContentLink = function (scope, element, attrs, controller) {
            controller.loadAll();
            //controller.setFakeValues();

            controller.show = "list";

            scope.gamesShown = 10;
            scope.showMore = function(){
                scope.gamesShown += scope.gamesShown;

            };
            //console.log("appContent link executed");
            scope.mockAmount = 100;
        };
        return {
            templateUrl: "views/app-content.html",
            replace: true,
            controllerAs: "appContent",
            controller: ["$scope", "$http", "$log", "$mdSidenav", "$mdToast", "AdaptedEloRating", "simplePlayersService" , "simpleGamesService", appContentDirectiveController],
            link: appContentLink
        };
    });

})();