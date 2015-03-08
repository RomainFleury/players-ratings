/**
 * import-files.js
 *
 * @author   Romain FLEURY <fleury@romain.in>
 */
(function(){
    "use script";
    angular.module("bestPlayerApp").directive("importGeneratedData", function(){
        function controller($scope, $http, playerService, gamesService){
            self = this;
            var files = [
                {"name":"D3 A 2014-2015","url":"/tests_results/france_d3_2014-15-111d33e.json"}
            ];

            self.files = files;

            self.setData = function(id){
               if(files[id]){
                   $http.get(files[id].url).then(function(response){
                       fileContent = response.data;
                       gamesService.save(fileContent.games);
                       playerService.save(fileContent.players);
                       $scope.refreshAll();
                   });
               }
            };
        }

        function link(scope, element, attrs, controller){
            scope.files = controller.files;
        }
        return {
            templateUrl: '/views/import-generated-data.html',
            replace: true,
            transclude: true,
            controller: ["$scope","$http", "simplePlayersService", "simpleGamesService", controller],
            controllerAs: 'importFiles',
            link:link
        };
    });
})();