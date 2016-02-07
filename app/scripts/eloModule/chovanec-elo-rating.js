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