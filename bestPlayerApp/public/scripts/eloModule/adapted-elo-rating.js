/**
 * adapted-elo-rating.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function(){
    "use strict";

    angular.module("eloRating").provider("AdaptedEloRating", [function () {
        // thanks to Chovanec.elo-rating github
        this.KFACTOR = 50;

        this.$get = ["$http", "$log", "$q", function ($http, $log, $q) {

            var KFACTOR = this.KFACTOR;

            function getNewRatings(ratingA, ratingB, scoreA, scoreB, gamesCountA, gamesCountB) {

                var expectedScores = getExpectedScores(ratingA, ratingB);
                var expectedA = expectedScores["A"];
                var expectedB = expectedScores["B"];

                var newRatings = calculateNewRatings(ratingA, ratingB, expectedA, expectedB, scoreA, scoreB);

                debugger;
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

            function calculateNewRatings(ratingA, ratingB, expectedA, expectedB, scoreA, scoreB) {

                // transforming scores en 1 ou 0 pour respecter l'algo de base:
                var victoryA = (scoreA > scoreB)?1:0;
                var victoryB = !victoryA;

                // ajouter la prise en compte plus violente de l'écart entre les joueurs
                // (ecart / 2) * KFACTOR * (1/expectedA);

                // ajouter la prise en compte du nombre de matchs joués


                var newRatingA = ratingA + ( KFACTOR * ( victoryA - expectedA ) );
                var newRatingB = ratingB + ( KFACTOR * ( victoryB - expectedB ) );

                debugger;
                return {"A": newRatingA, "B": newRatingB};
            }

            return {
                "getNewRatings": getNewRatings
            };
        }];
    }]);
})();