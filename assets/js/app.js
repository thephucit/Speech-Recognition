'use strict';

var app = angular.module('IOT', []);
app.controller('IndexController', function ($scope) {

    $scope.showTabs = function(tab) {
        switch(tab) {
            case 1:
                $scope.is_show_schedules = true;
                $scope.is_show_foods = false;
                break;
            case 2:
                $scope.is_show_schedules = false;
                $scope.is_show_foods = true;
                break;
            default:
                break;
        }
    };

    $scope.switchTabs = function(tab, ele) {
        $scope.showTabs(tab);
        let li_tab = window.document.querySelectorAll('li[role="presentation"]');
        let length = li_tab.length;
        for(let i = 0; i < length; ++i)
            (li_tab[i].classList.contains('active')) && li_tab[i].classList.remove('active');
        ele.srcElement.offsetParent.classList.add('active');
    };

    $scope.getStorage = function(name) {
        return JSON.parse(localStorage.getItem(name)) || [];
    };

    $scope.showTabs(1);
    $scope.backlogs = $scope.getStorage('backlogs');
    $scope.todos    = $scope.getStorage('todos');
    $scope.dones    = $scope.getStorage('dones');

    $scope.addBacklogs = function(title) {
        let temp = {'title':title, 'selected':false};
        $scope.backlogs.push(temp);
    };

    $scope.removeBacklogs = function(num) {
        let temp = $scope.backlogs[parseInt(num)];
        if(temp) {
            $scope.todos.push(temp);
            $scope.backlogs.splice(parseInt(num-1), 1);
        }
    };

    $scope.removeTodos = function(num) {
        let temp = $scope.todos[parseInt(num)];
        if(temp) {
            $scope.dones.push(temp);
            $scope.todos.splice(parseInt(num-1), 1);
        }
    };

    let commands = {
        'thêm mới *val': function(val) {
            $scope.addBacklogs(val);
            $scope.$apply();
        },
        'di dời *val': function(val) {
            $scope.removeBacklogs(val);
            $scope.$apply();
        },
        'ok *val': function(val) {
            $scope.removeTodos(val);
            $scope.$apply();
        },
    };


    TunSpeech.makeCommands(commands);
    TunSpeech.setLanguage('vi-VN');//en-US
    TunSpeech.debug();
    TunSpeech.start();

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