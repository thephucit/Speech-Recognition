function startConverting() {
    let me = window['me'];
    if('webkitSpeechRecognition' in window) {
        let speechRecognizer = new webkitSpeechRecognition();
        speechRecognizer.continuous = true;
        speechRecognizer.interimResults = true;
        speechRecognizer.lang = 'en-US';
        speechRecognizer.start();

        let finalTranscripts = '';
        speechRecognizer.onresult = function(event) {
            let interimTranscripts = '';
            for (var i = event.resultIndex; i < event.results.lenght; i++) {
                let transcript = event.results[i][0].transcript;
                transcript.replace("\n", "<br>");
                if(event.results[i].isFinal)
                    finalTranscripts += transcript;
                else
                    interimTranscripts += transcript;
            }
            me.innerHTML = finalTranscripts + '<span style="color: #999">' + interimTranscripts + '</span>';
        };
        speechRecognizer.onerror = function(event) {};
    } else {
        me.innerHTML = 'Your browser is not support';
    }
}

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
    $scope.todos         = $scope.getStorage('todos');
    $scope.dones         = $scope.getStorage('dones');

    $scope.addBacklogs = function(title) {
        let temp = {'title':title, 'selected':false};
        $scope.backlogs.push(temp);
    };

    $scope.removeBacklogs = function(num) {
        let temp = $scope.backlogs[parseInt(num)];
        $scope.todos.push(temp);
        $scope.backlogs.splice(parseInt(num-1), 1);
    };

    $scope.removeTodos = function(num) {
        let temp = $scope.todos[parseInt(num)];
        temp.selected = true;
        $scope.dones.push(temp);
        $scope.todos.splice(parseInt(num-1), 1);
    };

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