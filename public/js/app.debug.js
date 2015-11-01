(function() {
  'use strict';

  angular
    .module('debugApp', []);
})();

(function(){
    'use strict';
    delete localStorage.prefetchedArticles;

    var prefetched = {
            "articles": []
        };

    document.querySelector('button').addEventListener('click', function () {
        get('/text')
            .then(function fun1 (stringData) {
                return resolve(JSON.parse(stringData));
            })
            .then(function fun2 (data){
                pushToArticles(data);
                return get('/text');
            })
            .then(function fun3 (stringData){
                pushToArticles(JSON.parse(stringData));
            })
            .catch(function (reason){
                console.error(reason);
            })
    });

    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomizer () {
        var test = getRandomInt(0, 10);
        console.log('test: ', test);
        return test > 6;
    }

    function get(url) {
        var request = new XMLHttpRequest(),
            promise = new Promise(function (resolve, reject) {
                request.open('GET', url);

                request.onreadystatechange = function () {
                  if (this.readyState === 4) {
                    this.status === 200
                        ? resolve(this.responseText)
                        : reject(this.statusText)
                  }
                };

                request.send();
            });

        return promise;
    }

    function resolve (data){
        return Promise.resolve(data);
    }

    function pushToArticles (data){
        prefetched.articles.push(data);
        localStorage.setItem('prefetchedArticles', JSON.stringify(prefetched));
    }


})();

(function() {
  'use strict';

  angular
    .module('debugApp')
    .directive('debugList', debugList);

  /* @ngInject */
  function debugList($rootScope) {
    return {
      bindToController: true,
      controller: debugListCtrl,
      controllerAs: 'debugList',
      link: link,
      restrict: 'A',
      scope: {},
      template: [
        '<div>',
          '<button ng-click="debugList.getArticle()">Add article</button>',
          '<button ng-click="debugList.clearArticles()">Remove articles</button>',
        '</div>',
        '<h1>{{debugList.title}}</h1>',
        '<div class="articles-list">',
          '<div ng-repeat="article in debugList.articles">',
            '<list-el data="article"></list-el>',
          '</div>',
        '</div>'
      ].join('')
    };

    function link(scope, element, attrs) {}
  }
  debugList.$inject = ["$rootScope"];

  /* @ngInject */
  function debugListCtrl(loremService) {
    var self = this;

    self.title = "Articles list";
    self.articles = [];
    self.getArticle = getArticle;
    self.clearArticles = clearArticles;

    function getArticle() {
      if (!self.articles.length) {
          var prefetchedData = localStorage.getItem("prefetchedArticles");
          if(prefetchedData){
            prefetchedData = JSON.parse(prefetchedData);

            if (prefetchedData.articles){
                self.articles = prefetchedData.articles;
            }
          }
      }

      loremService
        .getLoremText()
        .then(function(article){
            self.articles.push(article.data);
            console.log(self.articles);
        })
    }

    function clearArticles () {
      self.articles = [];
    }
  }
  debugListCtrl.$inject = ["loremService"];

})();

(function() {
    'use strict';

    angular
        .module('debugApp')
        .directive('listEl', listEl);

    /* @ngInject */
    function listEl($rootScope) {
        return {
            controller: Controller,
            link: link,
            restrict: 'AE',
            scope: {
                "data": "="
            },
            template: [
                '<section>',
                    '<header>',
                        '<spam>Words count: {{data.letterCount}}</span></br>',
                        '<spam>Letter count: {{data.text.length}}</span>',
                    '</header>',
                    '<p>{{data.text}}</p>',
                '</section>'
            ].join('')
        };

        function link(scope, element, attrs) {}
    }
    listEl.$inject = ["$rootScope"];

    /* @ngInject */
    function Controller() {}

})();

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
  loremService.$inject = ["$http"];
})();
