(function() {
  'use strict';

  angular
    .module('debugApp')
    .factory('loremService', loremService);

  /* @ngInject */
  function loremService($http) {
    return {
      getLoremText: getLoremText
    };

    ////////////////

    function getLoremText () {
      return $http.get('/text');
    }
  }
})();
