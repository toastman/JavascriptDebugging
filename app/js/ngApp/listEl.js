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

    /* @ngInject */
    function Controller() {}

})();
