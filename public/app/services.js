(function(angular) {

    var app = angular.module('league');

    //how long I want to store data in local storage for
    //first number is minutes * 60000 makes it milliseconds
    var STORAGE_TIME = 30 * 60000;

    app.service('getSummoner', ['$http', '$q', '$location', function($http, $q, $location) {
        return {
            getSummoner: function (summonerName, region) {
                var def = $q.defer();

                //grab from localstorage if the summonerId was stored less than 30 mins ago
                if(localStorage[summonerName] && JSON.parse(localStorage[summonerName]).region == region && ((new Date().getTime() - (JSON.parse(localStorage[summonerName]).storageTime)) <= STORAGE_TIME)){
                    var response = {};
                    response[summonerName] = JSON.parse(localStorage[summonerName]);
                    def.resolve(response);
                }

                else {
                    var host = $location.$$host+':'+$location.$$port;

                    $http.get('http://'+host+'/summoner/'+region+'/'+summonerName).success(function (response) {

                        //request was successful
                        if (response[summonerName]) {
                            var summoner = response[summonerName];
                            summoner.storageTime = new Date().getTime();
                            summoner.region = region;
                            summoner = JSON.stringify(summoner);
                            localStorage.setItem(summonerName, summoner);

                        }
                        return def.resolve(response);

                    });
                }
                return def.promise;
            }
        }
    }]);

    app.service('getTeams', ['$http', '$q', '$location', function($http, $q, $location) {
        return {
            getTeams: function (summonerId, summonerName, region ) {
                var def = $q.defer();

                //grab from localstorage if the teams were stored less than 30 mins ago
                if(JSON.parse(localStorage[summonerName]).teams && ((new Date().getTime() - (JSON.parse(localStorage[summonerName]).storageTime)) <= STORAGE_TIME)){
                    var teams = JSON.parse(localStorage[summonerName]).teams;
                    def.resolve(teams);
                }
                else {
                    var host = $location.$$host+':'+$location.$$port;

                    $http.get('http://'+host+'/teams/'+region+'/'+summonerId).success(function (response) {
                        var summoner = JSON.parse(localStorage[summonerName]);
                        summoner.teams = response[summonerId];
                        summoner = JSON.stringify(summoner);
                        localStorage.setItem(summonerName, summoner);


                        return def.resolve(response[summonerId]);
                    });
                }
                return def.promise;
            }
        }
    }]);

    app.service('getMatchDetails', ['$http', '$q', '$location', function($http, $q, $location) {
        return {
            getMatchDetails: function (matchIds, teamName, region) {
                var def = $q.defer();
                var promises = [];


                //if the team is in local storage and less than STORAGE_TIME mins have passed, get from local storage
                if (localStorage[teamName] && ((new Date().getTime() - (JSON.parse(localStorage[teamName]).storageTime)) <= STORAGE_TIME)) {
                    $q.all(promises).then(function() {
                        var matches = JSON.parse(localStorage[teamName]).matches;
                        return def.resolve(matches);
                    });
                }

                else{
                    var host = $location.$$host+':'+$location.$$port;

                    angular.forEach(matchIds, function(matchId){
                        promises.push(
                            $http.get('http://'+host+'/match/'+region+'/'+matchId)
                        );
                    });

                    $q.all(promises).then(function(response){
                        var ressend = [];
                        if (response[response.length - 1].data.matchType) {
                            for (i = 0; i < response.length; i++){
                                if (response[i].data) {
                                    ressend.push(response[i]['data']);
                                }
                            }
                            var matchStorage = {};
                            matchStorage.storageTime = new Date().getTime();
                            matchStorage.matches = ressend;
                            matchStorage = JSON.stringify(matchStorage);
                            localStorage.setItem(teamName, matchStorage);
                        } else {}

                        return def.resolve(ressend);
                    });
                }

                return def.promise;
            }
        }
    }]);

    //for sharing data between controllers
    app.service('shareData', function() {
        this.DESIRED_GAMES = 5;

        this.getDesiredGames = function(){
            return this.DESIRED_GAMES;
        };
        this.setSummoner = function(summoner) {
            this.summoner = summoner;
        };
        this.getSummoner = function() {
            return this.summoner;
        };
        this.setMatches = function(matches) {
            this.matches = matches;
        };
        this.getMatches = function() {
            return this.matches;
        };
        this.setTeam = function(selectedTeam){
            this.team = selectedTeam;
        };
        this.getTeam = function(){
            return this.team;
        };
        this.setOpposingTeamNames = function(opposingTeamNames){
            this.opposingTeamNames = opposingTeamNames;
        };
        this.getOpposingTeamNames = function(){
            return this.opposingTeamNames;
        };
    });
})(angular);