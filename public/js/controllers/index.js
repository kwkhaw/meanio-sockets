angular.module('mean.system').controller('IndexController', [
    '$scope',
    'Global',
    'socket',
    function($scope, Global, socket) {
        $scope.global = Global;
   
        socket.on('connect', function() {
            console.log("connected");
            socket.on('all', function(data) {
        var arr = [];
                arr.push(data);
                console.log(arr);
            });
            socket.on('disconnect', function() {});
        });
    }
]);
