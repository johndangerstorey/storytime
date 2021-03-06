angular.module('services')
.service('responseService', function ($http, $q) {
  // these codes should match config/httpCodes.json
  var codes = {
    "success": 202,
    "error":403
  }

  return {
    isSuccess: function(res){
      if (res.statusCode === 200 || res.status === 200){ console.error('API needs to be refactored to use ResponseUtil'); }
      else { return res.status === codes.success }
    },
    isError: function(res){
      if (res.statusCode === 500 || res.status === 500){ console.error('API needs to be refactored to use ResponseUtil'); }
      else { return res.status === codes.error }
    }
  }
});
