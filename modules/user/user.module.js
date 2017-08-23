(function () {
	'use strict';
	
var userCtrl = function(users, $scope, $http, $filter, $timeout) {
  $scope.users = users;
  $scope.sort = {       
    sortingOrder : 'id',
    reverse : false
  };
  $scope.gap = 3;
  $scope.filteredItems = [];
  $scope.groupedItems = [];
  $scope.itemsPerPage = 10;
  $scope.pagedItems = [];
  $scope.currentPage = 0;
  $scope.usersDetele = [];
  $scope.disableButtons = true;
  
  $scope.successAlert =function(success){
    $scope.success = true;
    $timeout( function(){
        $scope.success = false;
    }, 3000);
  };
  
  $scope.viewUser = function(user){
	$scope.userView = user;
    user.age = $scope.calculateAge(user.dateOfBirth);
  };
  
  $scope.deleteUser = function(user){
    $.each( $scope.users, function(i){
      if($scope.users[i].id === user.id) {
          $scope.users.splice(i,1);
          return false;
      }
    });
    $scope.successAlert();
    $scope.search();
  };
  
  $scope.downloadCvc = function(){
    csvString = "";
    for(var i=0; i<$scope.usersDetele.length;i++ ){
      csvString += $scope.usersDetele[i].id+";";
      csvString += $scope.usersDetele[i].firstName+";";
      csvString += $scope.usersDetele[i].lastName+";";
      csvString += $scope.usersDetele[i].country+";";
      csvString += $scope.usersDetele[i].email+";";
      csvString += $scope.usersDetele[i].dateOfBirth+";\n";
    }
   	var a = $('<a/>', {
      style:'display:none',
      href:'data:application/octet-stream;base64,'+btoa(csvString),
      download:'users.csv'
    }).appendTo('body');
    a[0].click();
    a.remove();
  };
  
  $scope.deleteUsers = function(){
    for(var i=0; i< $scope.usersDetele.length; i++){
      $scope.deleteUser($scope.usersDetele[i]);
    }
    $scope.disableButtons = true;
    $scope.usersDetele = [];
    $scope.search();
    $scope.successAlert();
  };
   
  $scope.selectDelete = function(user){
    if($("#check"+user.id).is(":checked")){
      $scope.usersDetele.push(user);
      $scope.disableButtons = false;
    }else{
      $.each( $scope.usersDetele, function(i){
        if($scope.usersDetele[i].id === user.id) {
          $scope.usersDetele.splice(i,1);
          return false;
        }
      });
      $scope.disableButtons = true;
    }
  };
  
  $scope.calculateAge = function (birthday) { // birthday is a date
    var dtbirthday = new Date(birthday);
    var ageDifMs = Date.now() - dtbirthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };
  
  //pagination functions
  var searchMatch = function (haystack, needle) {
    if (!needle) {
        return true;
    }
    return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
  };

  $scope.search = function () {
    $scope.filteredItems = $filter('filter')($scope.users, function (item) {
      for(var attr in item) {
        if (searchMatch(item[attr], $scope.query))
          return true;
        }
      return false;
    });
    // take care of the sorting order
    if ($scope.sort.sortingOrder !== '') {
      $scope.filteredItems = $filter('orderBy')($scope.filteredItems, $scope.sort.sortingOrder, $scope.sort.reverse);
    }
    $scope.currentPage = 0;
    // now group by pages
    $scope.groupToPages();
  };
  
  // calculate page in place
  $scope.groupToPages = function () {
    $scope.pagedItems = [];
    for (var i = 0; i < $scope.filteredItems.length; i++) {
      if (i % $scope.itemsPerPage === 0) {
        $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [ $scope.filteredItems[i] ];
      } else {
        $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
      }
    }
  };
  
  $scope.range = function (size,start, end) {
    var ret = [];        
    if (size < end) {
      end = size;
      start = size-$scope.gap;
    }
    for (var i = start; i < end; i++) {
      ret.push(i);
    }        
    return ret;
  };
  
  $scope.prevPage = function () {
    if ($scope.currentPage > 0) {
        $scope.currentPage--;
    }
  };
  
  $scope.nextPage = function () {
    if ($scope.currentPage < $scope.pagedItems.length - 1) {
        $scope.currentPage++;
    }
  };
  
  $scope.setPage = function () {
    $scope.currentPage = this.n;
  };
  $scope.search();
};	

angular.module('user', ['ui.router', 'ngAnimate'])
.directive("customSort", function() {
  return {
    restrict: 'A',
    transclude: true,    
    scope: {
      order: '=',
      sort: '='
    },
    template : 
      ' <a ng-click="sort_by(order)" style="color: #555555;">'+
      '    <span ng-transclude></span>'+
      '    <i ng-class="selectedCls(order)"></i>'+
      '</a>',
    link: function(scope) {
      scope.sort_by = function(newSortingOrder) {       
        var sort = scope.sort;
        if (sort.sortingOrder == newSortingOrder){
          sort.reverse = !sort.reverse;
        }
        sort.sortingOrder = newSortingOrder;        
      };
      scope.selectedCls = function(column) {
        if(column == scope.sort.sortingOrder){
          return ('icon-chevron-' + ((scope.sort.reverse) ? 'down' : 'up'));
        }
        else{            
          return'icon-sort' ;
        } 
      };      
    }
  };
})
.service('UserService', function($http){
  function getUsers() {
    return $http.get( '/data/users.json');
  }
  return {
    getUsers: getUsers
  };
})
.config( function($stateProvider, $urlRouterProvider, $qProvider) {
  $urlRouterProvider.otherwise('/users');
  $stateProvider
  .state('users', {
    template: '<div ui-view></div>',
    resolve: {
      users: ['UserService', function (UserService) {
        return UserService.getUsers().then(
          function successCallback(response) {
            return response.data;
          }, 
          function errorCallback(response) {
            console.log("ERROR!!!!");
          }
        );  
      }]
    }
  })
  .state('users.list', {
    url: '/users',
    templateUrl: 'user/templetes/user-list.html',
    controller: userCtrl
  })
  .state('users.edit', {
    url: '/users/:id',
    templateUrl: 'user/templetes/user-edit.html',
    controller: function($scope, $stateParams, $state){
      $scope.user = $stateParams.user;
      $scope.auxuser = {};
      $scope.auxuser.firstName = $scope.user.firstName;
      $scope.auxuser.lastName = $scope.user.lastName;
      $scope.userEdit = function(){
        for(var i =0; i< $stateParams.users.length; i++){
          if($stateParams.users[i].id == $scope.user.id)
            $stateParams.users[i] = $scope.user;
        }
      };
     $scope.modalCancelChanges = function(option){
       if(option == 'yes'){
         $scope.user.firstName = $scope.auxuser.firstName;
         $scope.user.lastName = $scope.auxuser.lastName;
         $state.go('users.list');
       }
     };
      
    $scope.cancelChanges = function(){
        if( $scope.user.firstName != $scope.auxuser.firstName || $scope.auxuser.lastName != $scope.user.lastName){
          $('#modalAlert').modal('show'); 
        }
        else{
          $state.go('users.list');
        }
      };
    },
     params: {
        user: { },
        users: {}
    }
  });
})
.directive('rowUser', function(){
  return {
    templateUrl: 'user/templetes/user-row.html'
  };
})
.directive('modalUser', function(){
  return {
    restrict: 'E',    
    templateUrl: 'user/templetes/modal-user.html'
  };
})
.directive('modalAlert', function(){
  return {
    restrict: 'E',
    templateUrl: 'user/templetes/modal-alert.html'
  };
});

}());
