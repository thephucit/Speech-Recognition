'use strict';
var app = angular.module('IOT', ['ngDialog', 'ngSanitize']);
app.config(function ($httpProvider) {
    $httpProvider.defaults.withCredentials = true;
});
app.controller('IndexController', function ($scope, $http, ngDialog, $interval) {

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

    $scope.to_slug = function(str) {
        if(str === undefined) return;
        str = str.toString().toLowerCase();
        str = str.replace(/(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)/g, 'a');
        str = str.replace(/(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)/g, 'e');
        str = str.replace(/(ì|í|ị|ỉ|ĩ)/g, 'i');
        str = str.replace(/(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)/g, 'o');
        str = str.replace(/(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)/g, 'u');
        str = str.replace(/(ỳ|ý|ỵ|ỷ|ỹ)/g, 'y');
        str = str.replace(/(đ)/g, 'd');
        str = str.replace(/([^0-9a-z-\s])/g, '');
        str = str.replace(/(\s+)/g, '-');
        str = str.replace(/^-+/g, '');
        str = str.replace(/-+$/g, '');
        return str;
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

    var interval;
    $scope.getDetail = function(alias) {
        let options = {
            method: 'GET',
            url: alias,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        }
        $http(options).then(function(res) {
            let seconds = res.data.countdown;
            interval = $interval(function() {
                let days = Math.floor(seconds / 24 / 60 / 60);
                let hoursLeft = Math.floor((seconds) - (days * 86400));
                let hours = Math.floor(hoursLeft / 3600);
                let minutesLeft = Math.floor((hoursLeft) - (hours * 3600));
                let minutes = Math.floor(minutesLeft / 60);
                let remainingSeconds = seconds % 60;
                if (remainingSeconds < 10)
                    remainingSeconds = "0" + remainingSeconds;
                $scope.countdown_time = days + " ngày : " + hours + " giờ: " + minutes + " phút: " + remainingSeconds + ' giây';
                seconds--;
            }, 1000);
            $scope.detail = res.data;
        });
    };

    $scope.viewDetail = function(slug, title, id) {
        let alias = 'https://www.meete.co/'+slug+'/khuyen-mai-'+$scope.to_slug(title)+'-'+id;
        $scope.getDetail(alias);
        ngDialog.open({
            template: 'externalTemplate.html',
            width: '42%',
            showClose: false,
            scope: $scope
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
        'thêm việc *val': function(val) {
            $scope.addBacklogs(val.toLowerCase());
            $scope.$apply();
        },
        'thực hiện *val': function(val) {
            $scope.removeBacklogs(val.toLowerCase());
            $scope.$apply();
        },
        'xong *val': function(val) {
            $scope.removeTodos(val.toLowerCase());
            $scope.$apply();
        },
        'xem *val': function(val) {
            switch(val.toLowerCase()) {
                case 'công việc':
                    $scope.showTabs(1);
                    $scope.$apply();
                    break;
                case 'đồ ăn':
                    $scope.showTabs(2);
                    $scope.$apply();
                    break;
                case 'thêm':
                    $scope.page += 20;
                    $scope.getFoods('/'+$scope.page+'_ofs');
                    $scope.$apply();
                    break;
            }
        },
        'kéo *val': function(val) {
            switch(val.toLowerCase()) {
                case 'xuống':
                    $scope.scrollDown();
                    $scope.$apply();
                    break;
                case 'lên':
                    $scope.scrollUp();
                    $scope.$apply();
                    break;
            }
        },
        'về đầu trang': function() {
            window.scrollTo(0, 0);
            $scope.page = 0;
            $scope.getFoods();
        },
        'chi tiết *val': function(val) {
            angular.forEach($scope.foods, function(value, key) {
                if(value.id == val || value.address.toLowerCase().includes(val.toLowerCase()) || value.name.toLowerCase().includes(val.toLowerCase()) || value.title.toLowerCase().includes(val.toLowerCase())) {
                    let alias = 'https://www.meete.co/'+value.slug+'/khuyen-mai-'+$scope.to_slug(value.title)+'-'+value.id;
                    $scope.getDetail(alias);
                    ngDialog.open({
                        template: 'externalTemplate.html',
                        width: '42%',
                        showClose: false,
                        scope: $scope
                    });
                    $scope.$apply();
                    return;
                }
            });
        },
        'đóng lại': function() {
            $interval.cancel(interval);
            delete $scope.detail;
            ngDialog.close();
        },
        'tải lại trang': function(val) {
            window.location.reload();
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