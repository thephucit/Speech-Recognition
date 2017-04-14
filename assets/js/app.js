'use strict';
var app = angular.module('IOT', []);
app.config(function ($httpProvider) {
    $httpProvider.defaults.withCredentials = true;
});
app.controller('IndexController', function ($scope, $http) {

    $scope.showTabs = function(tab) {
        switch(tab) {
            case 1:
                $scope.is_show_schedules = true;
                $scope.is_show_foods = false;
                $scope.class_tab_1 = 'active';
                $scope.class_tab_2 = '';
                break;
            case 2:
                $scope.is_show_schedules = false;
                $scope.is_show_foods = true;
                $scope.class_tab_1 = '';
                $scope.class_tab_2 = 'active';
                $scope.page = 0;
                $scope.getFoods();
                break;
            default:
                break;
        }
    };

    $scope.getStorage = function(name) {
        return JSON.parse(localStorage.getItem(name)) || [];
    };

    $scope.showTabs(1);
    $scope.scroll = 500;
    $scope.backlogs = $scope.getStorage('backlogs');
    $scope.todos    = $scope.getStorage('todos');
    $scope.dones    = $scope.getStorage('dones');

    $scope.addBacklogs = function(title) {
        let temp = {'title':title};
        $scope.backlogs.push(temp);
    };

    $scope.removeBacklogs = function(listen) {
        angular.forEach($scope.backlogs, function(value, key) {
            if(value.title.includes(listen)) {
                let temp = $scope.backlogs[key];
                $scope.todos.push(temp);
                $scope.backlogs.splice(key, 1);
            }
        });
    };

    $scope.removeTodos = function(listen) {
        angular.forEach($scope.todos, function(value, key) {
            if(value.title.includes(listen)) {
                let temp = $scope.todos[key];
                $scope.dones.push(temp);
                $scope.todos.splice(key, 1);
            }
        });
    };

    $scope.getFoods = function(num = '') {
        let options = {
            method: 'GET',
            url: 'https://www.meete.co/ho-chi-minh' + num,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        }
        $http(options).then(function(res) {
            $scope.foods = res.data.data;
            if(res.data.data.length === 0)
                $scope.page = 0;
        });
    };

    $scope.scrollDown = function() {
        window.scrollTo(0, $scope.scroll);
        if($scope.scroll <= document.body.scrollHeight)
            $scope.scroll += 500;
    };

    $scope.scrollUp = function() {
        window.scrollTo(0, $scope.scroll);
        if($scope.scroll > 0)
            $scope.scroll -= 500;
    };

    let commands = {
        'thêm công việc *val': function(val) {
            $scope.addBacklogs(val);
            $scope.$apply();
        },
        'thực hiện *val': function(val) {
            $scope.removeBacklogs(val);
            $scope.$apply();
        },
        'ok *val': function(val) {
            $scope.removeTodos(val);
            $scope.$apply();
        },
        'xem *val': function(val) {
            switch(val) {
                case 'kế hoạch':
                    $scope.showTabs(1);
                    $scope.$apply();
                    break;
                case 'thức ăn':
                    $scope.showTabs(2);
                    $scope.$apply();
                    break;
            }
        },
        'tìm thêm': function(val) {
            $scope.page += 20;
            $scope.getFoods('/'+$scope.page+'_ofs');
        },
        'kéo xuống': function() {
            $scope.scrollDown();
        },
        'xuống phát nữa': function() {
            $scope.scrollDown();
        },
        'kéo lên': function() {
            $scope.scrollUp();
        },
        'lên phát nữa': function() {
            $scope.scrollUp();
        },
        'về đầu trang': function() {
            window.scrollTo(0, 0);
            $scope.page = 0;
            $scope.getFoods();
        }
    };

    TunSpeech.makeCommands(commands);
    TunSpeech.setLanguage('vi-VN');
    TunSpeech.debug();
    TunSpeech.run();

    $scope.$watch('backlogs', function(newValue, oldValue) {
        localStorage.setItem('backlogs', JSON.stringify(newValue));
    }, true);
    $scope.$watch('todos', function(newValue, oldValue) {
        localStorage.setItem('todos', JSON.stringify(newValue));
    }, true);
    $scope.$watch('dones', function(newValue, oldValue) {
        localStorage.setItem('dones', JSON.stringify(newValue));
    }, true);
});