!function(){"use strict";angular.module("debugApp",[])}(),function(){"use strict";function t(t){var e=new XMLHttpRequest,n=new Promise(function(n,i){e.open("GET",t),e.onreadystatechange=function(){4===this.readyState&&(200===this.status?n(this.responseText):i(this.statusText))},e.send()});return n}function e(t){return Promise.resolve(t)}function n(t){i.articles.push(t),localStorage.setItem("prefetchedArticles",JSON.stringify(i))}delete localStorage.prefetchedArticles;var i={articles:[]};document.querySelector("button").addEventListener("click",function(){t("/text").then(function(t){return e(JSON.parse(t))}).then(function(e){return n(e),t("/text")}).then(function(t){n(JSON.parse(t))})["catch"](function(t){console.error(t)})})}(),function(){"use strict";function t(t){function n(t,e,n){}return{bindToController:!0,controller:e,controllerAs:"debugList",link:n,restrict:"A",scope:{},template:["<div>",'<button ng-click="debugList.getArticle()">Add article</button>','<button ng-click="debugList.clearArticles()">Remove articles</button>',"</div>","<h1>{{debugList.title}}</h1>",'<div class="articles-list">','<div ng-repeat="article in debugList.articles">','<list-el data="article"></list-el>',"</div>","</div>"].join("")}}function e(t){function e(){if(!i.articles.length){var e=localStorage.getItem("prefetchedArticles");e&&(e=JSON.parse(e),e.articles&&(i.articles=e.articles))}t.getLoremText().then(function(t){i.articles.push(t.data),console.log(i.articles)})}function n(){i.articles=[]}var i=this;i.title="Articles list",i.articles=[],i.getArticle=e,i.clearArticles=n}angular.module("debugApp").directive("debugList",t),t.$inject=["$rootScope"],e.$inject=["loremService"]}(),function(){"use strict";function t(t){function n(t,e,n){}return{controller:e,link:n,restrict:"AE",scope:{data:"="},template:["<section>","<header>","<spam>Words count: {{data.letterCount}}</span></br>","<spam>Letter count: {{data.text.length}}</span>","</header>","<p>{{data.text}}</p>","</section>"].join("")}}function e(){}angular.module("debugApp").directive("listEl",t),t.$inject=["$rootScope"]}(),function(){"use strict";function t(t){function e(){return t.get("/text")}return{getLoremText:e}}angular.module("debugApp").factory("loremService",t),t.$inject=["$http"]}();
//# sourceMappingURL=maps/app.js.map