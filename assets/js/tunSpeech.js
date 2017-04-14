'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

(function(root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return root.TunSpeech = factory(root);
        });
    } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
        module.exports = factory(root);
    } else {
        root.TunSpeech = factory(root);
    }
})(typeof window !== 'undefined' ? window : undefined, function(root, undefined) {
    "use strict";
    var TunSpeech;
    var SpeechRecognition = root.SpeechRecognition || root.webkitSpeechRecognition || root.mozSpeechRecognition || root.msSpeechRecognition || root.oSpeechRecognition;
    if (!SpeechRecognition) return null;
    var commandsList = [];
    var recognition;
    var callbacks = {
        start: [],
        error: [],
        end: [],
        soundstart: [],
        result: [],
        resultMatch: [],
        resultNoMatch: [],
        errorNetwork: [],
        errorPermissionBlocked: [],
        errorPermissionDenied: []
    };
    var autoRestart;
    var lastStartedAt = 0;
    var autoRestartCount = 0;
    var debugState = false;
    var debugStyle = 'font-weight: bold; color: #00f;';
    var pauseListening = false;
    var _isListening = false;
    var optionalParam = /\s*\((.*?)\)\s*/g;
    var optionalRegex = /(\(\?:[^)]+\))\?/g;
    var namedParam = /(\(\?)?:\w+/g;
    var splatParam = /\*\w+/g;
    var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#]/g;
    var commandToRegExp = function commandToRegExp(command) {
        command = command.replace(escapeRegExp, '\\$&').replace(optionalParam, '(?:$1)?').replace(namedParam, function(match, optional) {
            return optional ? match : '([^\\s]+)';
        }).replace(splatParam, '(.*?)').replace(optionalRegex, '\\s*$1?\\s*');
        return new RegExp('^' + command + '$', 'i');
    };
    var invokeCallbacks = function invokeCallbacks(callbacks) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }
        callbacks.forEach(function(callback) {
            callback.callback.apply(callback.context, args);
        });
    };
    var isInitialized = function isInitialized() {
        return recognition !== undefined;
    };
    var logMessage = function logMessage(text, extraParameters) {
        if (text.indexOf('%c') === -1 && !extraParameters) {
            console.log(text);
        } else {
            console.log(text, extraParameters || debugStyle);
        }
    };
    var initIfNeeded = function initIfNeeded() {
        if (!isInitialized()) {
            TunSpeech.init({}, false);
        }
    };
    var registerCommand = function registerCommand(command, callback, originalPhrase) {
        commandsList.push({
            command: command,
            callback: callback,
            originalPhrase: originalPhrase
        });
        if (debugState) {
            logMessage('Command successfully loaded: %c' + originalPhrase, debugStyle);
        }
    };
    var parseResults = function parseResults(results) {
        invokeCallbacks(callbacks.result, results);
        var commandText;
        for (var i = 0; i < results.length; i++) {
            commandText = results[i].trim();
            if (debugState) {
                logMessage('Speech recognized: %c' + commandText, debugStyle);
            }
            for (var j = 0, l = commandsList.length; j < l; j++) {
                var currentCommand = commandsList[j];
                var result = currentCommand.command.exec(commandText);
                if (result) {
                    var parameters = result.slice(1);
                    if (debugState) {
                        logMessage('command matched: %c' + currentCommand.originalPhrase, debugStyle);
                        if (parameters.length) {
                            logMessage('with parameters', parameters);
                        }
                    }
                    currentCommand.callback.apply(this, parameters);
                    invokeCallbacks(callbacks.resultMatch, commandText, currentCommand.originalPhrase, results);
                    return;
                }
            }
        }
        invokeCallbacks(callbacks.resultNoMatch, results);
    };
    TunSpeech = {
        init: function init(commands) {
            var resetCommands = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
            if (recognition && recognition.abort) {
                recognition.abort();
            }
            recognition = new SpeechRecognition();
            recognition.maxAlternatives = 5;
            recognition.continuous = root.location.protocol === 'http:';
            recognition.lang = 'en-US';
            recognition.onstart = function() {
                _isListening = true;
                invokeCallbacks(callbacks.start);
            };
            recognition.onsoundstart = function() {
                invokeCallbacks(callbacks.soundstart);
            };
            recognition.onerror = function(event) {
                invokeCallbacks(callbacks.error, event);
                switch (event.error) {
                    case 'network':
                        invokeCallbacks(callbacks.errorNetwork, event);
                        break;
                    case 'not-allowed':
                    case 'service-not-allowed':
                        autoRestart = false;
                        if (new Date().getTime() - lastStartedAt < 200) {
                            invokeCallbacks(callbacks.errorPermissionBlocked, event);
                        } else {
                            invokeCallbacks(callbacks.errorPermissionDenied, event);
                        }
                        break;
                }
            };
            recognition.onend = function() {
                _isListening = false;
                invokeCallbacks(callbacks.end);
                if (autoRestart) {
                    var timeSinceLastStart = new Date().getTime() - lastStartedAt;
                    autoRestartCount += 1;
                    if (autoRestartCount % 10 === 0) {
                        if (debugState) {
                            logMessage('Speech Recognition is repeatedly stopping and starting.');
                        }
                    }
                    if (timeSinceLastStart < 1000) {
                        setTimeout(function() {
                            TunSpeech.start({
                                paused: pauseListening
                            });
                        }, 1000 - timeSinceLastStart);
                    } else {
                        TunSpeech.start({
                            paused: pauseListening
                        });
                    }
                }
            };
            recognition.onresult = function(event) {
                if (pauseListening) {
                    if (debugState) {
                        logMessage('Speech heard, but TunSpeech is paused');
                    }
                    return false;
                }
                var SpeechRecognitionResult = event.results[event.resultIndex];
                var results = [];
                for (var k = 0; k < SpeechRecognitionResult.length; k++) {
                    results[k] = SpeechRecognitionResult[k].transcript;
                }
                parseResults(results);
            };
            if (resetCommands) {
                commandsList = [];
            }
            if (commands.length) {
                this.makeCommands(commands);
            }
        },
        start: function start(options) {
            initIfNeeded();
            options = options || {};
            if (options.paused !== undefined) {
                pauseListening = !!options.paused;
            } else {
                pauseListening = false;
            }
            if (options.autoRestart !== undefined) {
                autoRestart = !!options.autoRestart;
            } else {
                autoRestart = true;
            }
            if (options.continuous !== undefined) {
                recognition.continuous = !!options.continuous;
            }
            lastStartedAt = new Date().getTime();
            try {
                recognition.start();
            } catch (e) {
                if (debugState) {
                    logMessage(e.message);
                }
            }
        },
        abort: function abort() {
            autoRestart = false;
            autoRestartCount = 0;
            if (isInitialized()) {
                recognition.abort();
            }
        },
        pause: function pause() {
            pauseListening = true;
        },
        resume: function resume() {
            TunSpeech.start();
        },
        debug: function debug() {
            var newState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
            debugState = !!newState;
        },
        setLanguage: function setLanguage(language) {
            initIfNeeded();
            recognition.lang = language;
        },
        makeCommands: function makeCommands(commands) {
            var cb;
            initIfNeeded();
            for (var phrase in commands) {
                if (commands.hasOwnProperty(phrase)) {
                    cb = root[commands[phrase]] || commands[phrase];
                    if (typeof cb === 'function') {
                        registerCommand(commandToRegExp(phrase), cb, phrase);
                    } else if ((typeof cb === 'undefined' ? 'undefined' : _typeof(cb)) === 'object' && cb.regexp instanceof RegExp) {
                        registerCommand(new RegExp(cb.regexp.source, 'i'), cb.callback, phrase);
                    } else {
                        if (debugState) {
                            logMessage('Can not register command: %c' + phrase, debugStyle);
                        }
                        continue;
                    }
                }
            }
        },
        removeCommands: function removeCommands(commandsToRemove) {
            if (commandsToRemove === undefined) {
                commandsList = [];
            } else {
                commandsToRemove = Array.isArray(commandsToRemove) ? commandsToRemove : [commandsToRemove];
                commandsList = commandsList.filter(function(command) {
                    for (var i = 0; i < commandsToRemove.length; i++) {
                        if (commandsToRemove[i] === command.originalPhrase) {
                            return false;
                        }
                    }
                    return true;
                });
            }
        },
        addCallback: function addCallback(type, callback, context) {
            var cb = root[callback] || callback;
            if (typeof cb === 'function' && callbacks[type] !== undefined) {
                callbacks[type].push({
                    callback: cb,
                    context: context || this
                });
            }
        },
        removeCallback: function removeCallback(type, callback) {
            var compareWithCallbackParameter = function compareWithCallbackParameter(cb) {
                return cb.callback !== callback;
            };
            for (var callbackType in callbacks) {
                if (callbacks.hasOwnProperty(callbackType)) {
                    if (type === undefined || type === callbackType) {
                        if (callback === undefined) {
                            callbacks[callbackType] = [];
                        } else {
                            callbacks[callbackType] = callbacks[callbackType].filter(compareWithCallbackParameter);
                        }
                    }
                }
            }
        },
        isListening: function isListening() {
            return _isListening && !pauseListening;
        },
        getSpeechRecognizer: function getSpeechRecognizer() {
            return recognition;
        },
        trigger: function trigger(sentences) {
            if (!TunSpeech.isListening()) {
                if (debugState) {
                    if (!_isListening) {
                        logMessage('Cannot trigger while TunSpeech is aborted');
                    } else {
                        logMessage('Speech heard, but TunSpeech is paused');
                    }
                }
                return;
            }
            if (!Array.isArray(sentences)) {
                sentences = [sentences];
            }
            parseResults(sentences);
        }
    };
    return TunSpeech;
});