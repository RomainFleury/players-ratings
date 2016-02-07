(function () {
  "use strict";

  angular.module("bestPlayerApp").directive("testContent", function () {
    var testContentDirectiveController = function ($scope, $log, $mdSidenav, $mdToast,
      $q, ratingService, playerService, teamgameService, teamService, $filter, gamesService) {
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
      controller: ["$scope", "$log", "$mdSidenav", "$mdToast", "$q", "AdaptedEloRating", "parsePlayersService", "pouchTeamgamesService", "parseTeamsService", "$filter", "parseGamesService", testContentDirectiveController],
      link: testContentLink
    };
  });
})();
