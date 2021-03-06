angular.module('services')
.service('utilityService', function ($http, $q) {
  return {
    validateEmail: function(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },

    isString: function(str){
      return typeof str === 'string';
    },

    isObject: function(obj){
      return typeof obj === 'object';
    }
  }
});
