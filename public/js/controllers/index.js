angular.module('mean.system').controller('IndexController', [
    '$scope',
    'Global',
    'socket',
    function($scope, Global, socket) {
        $scope.global = Global;

        socket.on('connect', function() {
            console.log("connected");
            socket.on('event', function(data) {
                console.log(data);
            });
            socket.on('disconnect', function() {});
        });
    }
]);
