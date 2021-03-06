angular.module('directives')
	.directive('story', function () {
		return {
			restrict: 'E',
			replace: true,
      controller:  function($scope, $routeParams, $timeout, $compile, storiesService, inputService, $location) {
        var storyId = $scope.storyid ? $scope.storyid : $routeParams.storyId;

        var shouldSetAsSelected = function(storyObj){
          if($location.$$path.indexOf('/story/') === 0) { // checks for if on "story" page
            storiesService.setSelectedStory(storyObj);
          }
        }

        var applyStoryToView = function(storyObj){
          $scope.storyObj = storyObj;
					const inputs = storyObj.inputs;
          $scope.storyObj.html = inputService.prepareForAngular($scope.storyObj.html, inputs)

          $timeout(function(){
            // TODO: un-hack this
            // done because angular strips out attributes on span
            // if used in ng-bind-html -- however, sometimes it
            // doesn't execute on time
            var storyDiv = document.getElementById('replace-with-html');
            storyDiv.innerHTML = $scope.storyObj.html;
            $compile(storyDiv)($scope);
          },100);
        };


        if ($scope.storyobj){
          applyStoryToView($scope.storyobj);
        } else if(storyId) {
          storiesService.searchStories({_id:storyId}).then(function(res){
            shouldSetAsSelected(res.data);
            applyStoryToView(res.data);
          });
        } else {
          console.error('No storyObject, or storyId was supplied to story directive')
        }
      },
			templateUrl: '/partials/story/story.html',
			scope: {
        storyid: '=', // using = so always pass it in as a variable
        storyobj: '=',
        excludeimage: '@'
      }
		}
	}
)
