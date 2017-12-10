"use strict";

require("@babel/polyfill");

var _vantage = _interopRequireDefault(require("vantage"));

var _express = _interopRequireDefault(require("express"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _Player = _interopRequireDefault(require("./Player"));

/** Commands - End */

/** CLI Actions */
var lsAction =
/*#__PURE__*/
function () {
  var _ref5 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4(args, callback) {
    var result;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return ls();

          case 2:
            result = _context4.sent;
            this.log(result);
            callback();

          case 5:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function lsAction(_x2, _x3) {
    return _ref5.apply(this, arguments);
  };
}();

var playAction =
/*#__PURE__*/
function () {
  var _ref6 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee5(args, callback) {
    var filePath, files, file;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            filePath = args && args.options && args.options.file;

            if (filePath) {
              _context5.next = 7;
              break;
            }

            _context5.next = 4;
            return readFiles();

          case 4:
            files = _context5.sent;
            file = files[0];
            /* eslint-enable prefer-destructuring */

            filePath = file.path;

          case 7:
            play(filePath);
            this.log("Playing \u2013 ".concat(player.filePath()));
            callback();

          case 10:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function playAction(_x4, _x5) {
    return _ref6.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var BANNER = '######################################################################\n' + '#                        Welcome to quattuor                         #\n' + '######################################################################';
var DELIMITER = 'quattuor$';
var PORT = 3000;
var FILES_PATH = 'assets';
var app = new _express.default();
var player = new _Player.default();
var server = (0, _vantage.default)().delimiter(DELIMITER).banner(BANNER).listen(app, PORT);

server.addCommand = function (_ref) {
  var command = _ref.command,
      options = _ref.options,
      description = _ref.description,
      action = _ref.action;
  var next = server.command(command);
  /* eslint-disable no-unused-expressions */

  description && next.description(description);
  /* eslint-enable no-unused-expressions */

  var addOptions = function addOptions(cmd, opts) {
    var _opts = _toArray(opts),
        first = _opts[0],
        rest = _opts.slice(1);

    var option = cmd.option(first);
    rest.forEach(function (element) {
      option = option.option(element);
    });
    return option;
  };

  next = options && addOptions(next, options) || next;
  next.action(action);
};
/** File System Helpers */


var readFiles =
/*#__PURE__*/
function () {
  var _ref2 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var filesPath,
        fullFilesPath,
        dirContent,
        _args2 = arguments;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            filesPath = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : FILES_PATH;
            fullFilesPath = _path.default.resolve(process.cwd(), filesPath);
            dirContent = _fs.default.readdirSync(fullFilesPath);
            return _context2.abrupt("return", Promise.all(dirContent.map(
            /*#__PURE__*/
            function () {
              var _ref3 = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee(file) {
                var fullPath, meta, sampleCount, bitRate, rest;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        fullPath = "".concat(fullFilesPath, "/").concat(file);
                        _context.next = 3;
                        return _Player.default.meta(fullPath);

                      case 3:
                        meta = _context.sent;
                        sampleCount = meta.sampleCount, bitRate = meta.bitRate, rest = _objectWithoutProperties(meta, ["sampleCount", "bitRate"]);
                        return _context.abrupt("return", _extends({}, rest, {
                          name: file,
                          path: fullPath
                        }));

                      case 6:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x) {
                return _ref3.apply(this, arguments);
              };
            }())));

          case 4:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function readFiles() {
    return _ref2.apply(this, arguments);
  };
}();
/** File System Helpers - End */

/** Commands */


var ls =
/*#__PURE__*/
function () {
  var _ref4 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3() {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.t0 = JSON;
            _context3.next = 3;
            return readFiles();

          case 3:
            _context3.t1 = _context3.sent;
            return _context3.abrupt("return", _context3.t0.stringify.call(_context3.t0, _context3.t1, null, 2));

          case 5:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function ls() {
    return _ref4.apply(this, arguments);
  };
}();

var play = function play(filePath) {
  player.play(filePath);
};

var pause = function pause() {
  player.pause();
};

var resume = function resume() {
  player.resume();
};

var stop = function stop() {
  player.stop();
};

function pauseAction(args, callback) {
  pause();
  this.log("Pausing Playback \u2013 ".concat(player.filePath()));
  callback();
}

function resumeAction(args, callback) {
  resume();
  this.log("Resuming Playback \u2013 ".concat(player.filePath()));
  callback();
}

function stopAction(args, callback) {
  stop();
  this.log('Stop Playback');
  callback();
}
/** CLI functions - End */

/** Add CLI Commands */


[{
  command: 'ls',
  description: 'List available audio files for playback.',
  action: lsAction
}, {
  command: 'play',
  description: 'Plays to provided audio file using "aplay".',
  options: ['-f --file'],
  action: playAction
}, {
  command: 'pause',
  description: 'Pauses the currently playing audio file.',
  action: pauseAction
}, {
  command: 'resume',
  description: 'Resumes playback of the current audio file.',
  action: resumeAction
}, {
  command: 'stop',
  description: 'Stops playback of the current audio file.',
  action: stopAction
}].forEach(function (cmd) {
  server.addCommand(cmd);
});
/** Add CLI Commands - End */

app.get('/ls',
/*#__PURE__*/
function () {
  var _ref7 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee6(req, res) {
    var files;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return readFiles();

          case 2:
            files = _context6.sent;
            res.send(files);

          case 4:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function (_x6, _x7) {
    return _ref7.apply(this, arguments);
  };
}());
app.get('/', function (req, res) {
  // server.exec('play')
  res.send(BANNER);
});
server.show();