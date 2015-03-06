(function(){
	angular.module('bestPlayerApp', ['ngMaterial']);

	angular.module('bestPlayerApp').controller('AppCtrl', ['$scope', '$mdSidenav', function($scope, $mdSidenav){
	  $scope.toggleSidenav = function(menuId) {
	    $mdSidenav(menuId).toggle();
	  }; 	 
	}]);
	
	angular.module('bestPlayerApp').directive('appContent', function() {

	        var appContentDirectiveController = function($scope, $http, $log, $mdSidenav, $mdToast) {
	            var self = this;

	            self.loading = true;
				self.newGame = {};
				/*
				self.newGame = {
						date:new Date(),
						playerAId:0,
						playerAName:'Joueur A',
						scoreA:1,
						ratingABeforeGame:1500,
						ratingAAfterGame:1500,
						playerBId:0,
						playerBName:'Joueur B',
						scoreB:0,
						ratingBBeforeGame:1500,
						ratingBAfterGame:1500
				};*/

	            self.toggleTab = function() {
	                $mdSidenav('left').toggle();
	            };
								
				self.new = function(){
					self.newGame = {};
					self.show = 'add';
				}
				
				self.save = function(){
					
					var players = getPlayers();
					
					var playerA = {'id':0,'name':'', 'rating':1500};
					var playerB = {'id':0,'name':'', 'rating':1500};
					
					var playerAName = self.newGame.playerAName;
					var playerBName = self.newGame.playerBName;
					
					// search players in players
					for(playerIndex in players){
						if(players[playerIndex] && players[playerIndex].name){
							if(players[playerIndex].name.indexOf(playerAName) === 0){
								console.log('player A found');
								playerA = players[playerIndex];
							}else{
								if(players[playerIndex].name.indexOf(playerBName) === 0){
									console.log('player B found');
									playerB = players[playerIndex];
								}
							}
						}
					}					
					
					// create players if required
					var playersCount = players.length;
					if(playerA.id === 0){
						playerA.name = playerAName;
						playerA.id = players.length+1;
						players.push(playerA);
					}
					if(playerB.id === 0){
						playerB.name = playerBName;
						playerB.id = players.length+1;
						players.push(playerB);
					}
					
					// save players if player list changed
					if(playersCount < players.length){
						savePlayers(players);
					}
					
					console.log('player A rating before match : '+ playerA.rating);
					console.log('player B rating before match : '+ playerB.rating);
					var ratingA = parseInt(playerA.rating);
					var ratingB = parseInt(playerB.rating);
					
					var scoreA = parseInt(self.newGame.scoreA);
					var scoreB = parseInt(self.newGame.scoreB);			
					
					var newRatings = getNewRatings(ratingA, ratingB, scoreA, scoreB);
					
					playerA.rating = newRatings.newRatings.A;
					playerB.rating = newRatings.newRatings.B;
					console.log('player A rating after match : '+ playerA.rating);
					console.log('player B rating after match : '+ playerB.rating);
										
					var game = {
						date:new Date(),
						playerAId:playerA.id,
						playerAName:playerA.name,
						scoreA:scoreA,
						playerARatingBeforeGame:ratingA,
						playerARatingAfterGame:playerA.rating,
						playerAExpectedVictory:Math.round(newRatings.expectedResult.A*100),
						playerBId:playerB.id,
						playerBName:playerB.name,
						scoreB:scoreB,
						playerBRatingBeforeGame:ratingB,
						playerBRatingAfterGame:playerB.rating,
						playerBExpectedVictory:Math.round(newRatings.expectedResult.B*100)
					};	
					
					// store game : 
					var games = getGames();
					games.push(game);
					// save games
					saveGames(games);
							

					// udpate players
					// search players in players
					for(playerIndex in players){
						if(players[playerIndex] && players[playerIndex].id){
							if(players[playerIndex].id === playerA.id){
								// player A found, must be replaced
								players[playerIndex] = playerA;
							}else{
								if(players[playerIndex].id === playerB.id){
									// player B found, must be replaced
									players[playerIndex] = playerB;
								}
							}
						}
					}
					// save updated players
					savePlayers(players);
					
					// reset :
					self.newGame = {};
				};
				
				self.resetAll = function(){
					localStorage.setItem('games', '[]');
					localStorage.setItem('players', '[]');
					self.games = [];
					self.players = [];
				}
				
				
				function getGames(){
					var stored = JSON.parse(localStorage.getItem('games'))
					return stored?stored:[];
				}
				
				function saveGames(games){
					localStorage.setItem('games', JSON.stringify(games));
					self.games = games;
				}
								
				function getPlayers(){
					var stored = JSON.parse(localStorage.getItem('players'));
					return stored?stored:[];
				}
				
				
				function savePlayers(players){
					localStorage.setItem('players', JSON.stringify(players));
					self.players = players;
				}
				
				self.loadAll = function(){
					self.games = getGames();
					self.players = getPlayers();
				}
								
	        };

	        var appContentLink = function(scope, element, attrs, controller) {
				controller.loadAll();
				
				controller.show = 'list';
	            console.log('appContent link executed');
	        };
	        return {
	            templateUrl: 'app-content.html',
	            replace: true,
	            controllerAs: 'appContent',
	            controller: ['$scope', '$http', '$log', '$mdSidenav', '$mdToast', appContentDirectiveController],
	            link: appContentLink
	        };
	    });
		
		
		
		
		
		// ELO Implementation from Chovanec/elo-rating github.
		var KFACTOR = 16;
		
		function getNewRatings(ratingA, ratingB, scoreA, scoreB){
			
			var expectedScores = getExpectedScores(ratingA,ratingB);
        
			var expectedA = expectedScores['A'];
			var expectedB = expectedScores['B'];
					
			var newRatings = calculateNewRatings(ratingA, ratingB, expectedA, expectedB, scoreA, scoreB);

			var newRatingA = newRatings['A'];
			var newRatingB = newRatings['B'];
			
			
			return {
				'newRatings': newRatings, // nouveau classement des joueurs
				'expectedResult': expectedScores // la cote en %
			};
		}
		
		function getExpectedScores(ratingA,ratingB)
		{
        	var expectedScoreA = 1 / ( 1 + ( Math.pow( 10 , ( ratingB - ratingA ) / 400 ) ) );
			var expectedScoreB = 1 / ( 1 + ( Math.pow( 10 , ( ratingA - ratingB ) / 400 ) ) );
			return {'A':expectedScoreA, 'B':expectedScoreB};
		}
		
		function calculateNewRatings(ratingA,ratingB,expectedA,expectedB,scoreA,scoreB)
    	{
        	var newRatingA = ratingA + Math.round( ( KFACTOR * ( scoreA - expectedA ) ) );
			var newRatingB = ratingB + Math.round( ( KFACTOR * ( scoreB - expectedB ) ) );
			return {'A':newRatingA, 'B':newRatingB };
		}

	
})();