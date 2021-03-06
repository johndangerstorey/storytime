angular.module('directives')
.directive('detailPage', function () {
  return {
    restrict: 'EA',
    replace: true,
    controller: function(
      $scope,
      $routeParams,
      $q,
      $timeout,
      $rootScope,
      ModalService,
      storiesService,
      paymentService,
      userService,
      responseService,
      analyticService) {
      /*
      remove feedback button
      */
      angular.element('.feedbackButton').hide()
      /*
      get story, variables, and format appropriately
      */
      storiesService.getSelectedStory($routeParams.storyId).then(function(res){
        res.createdOn = moment(res.createdAt).format('MMM Do, YYYY');
        $scope.story = res;
        $scope.story.price = $scope.story.price || 0;
        $scope.needToUnlock = !userService.hasPurchased($routeParams.storyId) && $scope.story.price;
      });
      /*
      handle non-logged in,
      not enough credit scenarios,
      success
      */
      $scope.handleSuccess = function(){
        window.location.pathname = '/story/'+$routeParams.storyId;
      }

      $scope.nextStep = function (e) {
        var hasEnoughCoins = userService.user.paymentInfo.coins >= $scope.story.price;
        if(!userService.isLoggedIn()){
          // download and take from autoPay
          $scope.paymentState = 'createAccount';
        } else if ( hasEnoughCoins ) {
          paymentService.payWithCoins($scope.story._id, $scope.story.price).then(function(res){
            if (responseService.isSuccess(res)){
              userService.syncUser().then(function(res){
                if(res){ $scope.handleSuccess(); }
                else { analyticService.error('user sync', 'detail.js') }
              });
            } else {
              analyticService.error('coin payment', 'detail.js')
            }
          })
        } else {
          var data = angular.merge($scope, {
            title: 'Not Enough Coins',
            body: "You currently don't have enough coins to purchase this story.  Don't worry though, you can buy more!",
            okayButtonText: 'Buy Coins',
            okayButtonLink: '/checkout'
          });
          ModalService.showModal({
            templateUrl: "partials/modals/baseModal/baseModal.html",
            controller: "BaseModalController",
            scope: data
          }).then(function(modal) {
            // listen for close
            modal.close.then(function(result) {
              $scope.customResult = "All good!";
            });
          });
          $scope.paymentState = 'buyCredit';
        }
      }

    },
    templateUrl: '/pages/detail/detail.html',
    scope: {}
  }
}
)
