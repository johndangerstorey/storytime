angular.module('directives')
.directive('textInput', function () {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/partials/input/input.html',
    scope: {
      ngModel: '=',
      ngLabel: '=',
      type: '@'
    },
    link: function(scope, elm, attrs){
      elm.find('label').html(scope.ngLabel || attrs.label)
    }
  }
})
