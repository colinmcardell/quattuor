'use strict';

require('babel-polyfill');

var _vantage = require('vantage');

var _vantage2 = _interopRequireDefault(_vantage);

var _koa = require('koa');

var _koa2 = _interopRequireDefault(_koa);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _aplay = require('aplay');

var _aplay2 = _interopRequireDefault(_aplay);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var BANNER = '######################################################################\n' + '#                        Welcome to quattuor                         #\n' + '#                                                                    #\n' + '#              All connections are monitored and recorded            #\n' + '#      Disconnect IMMEDIATELY if you are not an authorized user      #\n' + '######################################################################';
var DELIMITER = 'quattuor$';
var PORT = 3000;
var FILES_PATH = 'assets';

var audioFile = null;

var app = new _koa2.default();

app.use(function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            ctx.body = BANNER;

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}());

var server = (0, _vantage2.default)().delimiter(DELIMITER).banner(BANNER).listen(app, PORT);
server.addCommand = function (_ref2) {
  var command = _ref2.command,
      options = _ref2.options,
      description = _ref2.description,
      func = _ref2.func;

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
  next.action(func);
};

var player = new _aplay2.default();
player.on('complete', function () {
  server.log('Playback Complete \u2013 ' + audioFile);
});

/** File System Helpers */
var readFiles = function readFiles() {
  var path = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : FILES_PATH;
  return _fs2.default.readdirSync(path).map(function (file) {
    return path + '/' + file;
  });
};
/** File System Helpers - End */

/** CLI functions */
function ls(args, callback) {
  var files = readFiles();
  this.log(files);

  callback();
}

function play(args, callback) {
  audioFile = args.options.file || readFiles()[0];
  this.log('Playing \u2013 ' + audioFile);
  player.play(audioFile);
  callback();
}

function pause(args, callback) {
  this.log('Pausing Playback \u2013 ' + audioFile);
  player.pause();
  callback();
}

function resume(args, callback) {
  this.log('Resuming Playback \u2013 ' + audioFile);
  player.resume();
  callback();
}
/** CLI functions */

server.addCommand({
  command: 'ls',
  description: 'List available audio files for playback.',
  func: ls
});

server.addCommand({
  command: 'play',
  description: 'Plays to provided audio file using "aplay".',
  options: ['-f --file'],
  func: play
});

server.addCommand({
  command: 'pause',
  description: 'Pauses the currently playing audio file.',
  func: pause
});

server.addCommand({
  command: 'resume',
  description: 'Resumes playback of the current audio file.',
  func: resume
});

server.show();