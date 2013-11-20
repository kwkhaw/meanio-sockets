window.app = angular.module('mean', [
    'ngCookies',
    'ngResource',
    'btford.socket-io',
    'ui.bootstrap',
    'ui.route',
    'mean.system',
    'mean.articles'
]);

angular.module('mean.system', []);
angular.module('mean.articles', []);
