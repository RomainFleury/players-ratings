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
        this.defaultRating = 1500;
        this.gapWeight = 20;
        this.goalBonus = 1;

        this.$get = ["$http", "$log", "$q", function ($http, $log, $q) {

            var KFACTOR = this.KFACTOR;
            var defaultRating = this.defaultRating ;
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
                var victoryA = (scoreA > scoreB)?1:0;
                var victoryB = (scoreB > scoreA)?1:0;


                // ajout de la prise en compte de l'écart entre les joueurs
                var ratingGap = ratingA - ratingB;
                var ratingGapPonderate = Math.abs(ratingGap / (KFACTOR /gapWeight));

                // ajouter la prise en compte du nombre de matchs joués
                var gamesGapA = gamesCountA - gamesCountB;
                var gamesGapB = gamesCountB - gamesCountA;
                //TODO

                // ajout du nombre de buts marqués
                var scoreBonusA = scoreA * (goalBonus);
                var scoreBonusB = scoreB * (goalBonus);

                // on ajuste le nombre de points à gagner en fonction de l'écart entre les joueurs
                var newRatingA = ratingA + ( (KFACTOR + ratingGapPonderate) * ( victoryA - expectedA ));//* (1/expectedA));
                var newRatingB = ratingB + ( (KFACTOR + ratingGapPonderate) * ( victoryB - expectedB ));// * (1/expectedB));

                newRatingA += scoreBonusA;
                newRatingB += scoreBonusB;


                return {"A": newRatingA, "B": newRatingB};
            }

            return {
                "getNewRatings": getNewRatings,
                "scoreIsBool": false
            };
        }];
    }]);
})();