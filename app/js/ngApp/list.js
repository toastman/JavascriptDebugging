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

})();
