(function(){
    'use strict';
    delete localStorage.prefetchedArticles;

    var prefetched = {
            "articles": []
        };
    document.querySelector('button').addEventListener('click', function () {
        fetch('/text')
            .then(function fun1 (stringData) {
                return resolve(JSON.parse(stringData));
            })
            .then(function fun2 (data){
                pushToArticles(data);
                return fetch('/text');
            })
            .then(function fun3 (stringData){
                pushToArticles(JSON.parse(stringData));
            })
            .catch(function (reason){
                console.error(reason);
            })
    });

    function fetch(url) {
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
