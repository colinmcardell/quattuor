'use strict';

require('babel-polyfill');

var _vantage = require('vantage');

var _vantage2 = _interopRequireDefault(_vantage);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _aplay = require('aplay');

var _aplay2 = _interopRequireDefault(_aplay);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

// import Sox from 'sox'

var BANNER = '######################################################################\n' + '#                        Welcome to quattuor                         #\n' + '######################################################################';
var DELIMITER = 'quattuor$';
var PORT = 3000;
var FILES_PATH = 'assets';

var audioFile = null;

var app = new _express2.default();

app.get('/', function (req, res) {
  return res.send(BANNER);
});

var server = (0, _vantage2.default)().delimiter(DELIMITER).banner(BANNER).listen(app, PORT);
server.addCommand = function (_ref) {
  var command = _ref.command,
      options = _ref.options,
      description = _ref.description,
      func = _ref.func;

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
  server.log('Playback Complete \u2013 ' + audioFile.path);
});

/** File System Helpers */
var readFiles = function readFiles() {
  var filesPath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : FILES_PATH;

  var fullFilesPath = _path2.default.resolve(process.cwd(), filesPath);
  return _fs2.default.readdirSync(fullFilesPath).map(function (file) {
    var fullPath = fullFilesPath + '/' + file;
    return {
      path: fullPath
    };
  });
};

/** File System Helpers - End */

/** CLI functions */
function ls(args, callback) {
  var files = JSON.stringify(readFiles());
  this.log(files);
  callback();
}

function play(args, callback) {
  audioFile = args && args.options && args.options.file || readFiles()[0];
  this.log('Playing \u2013 ' + audioFile.path);
  player.play(audioFile.path);
  callback();
}

function pause(args, callback) {
  this.log('Pausing Playback \u2013 ' + audioFile.path);
  player.pause();
  callback();
}

function resume(args, callback) {
  this.log('Resuming Playback \u2013 ' + audioFile.path);
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