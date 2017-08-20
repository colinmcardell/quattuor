'use strict';

require('babel-polyfill');

var _vantage = require('vantage');

var _vantage2 = _interopRequireDefault(_vantage);

var _koa = require('koa');

var _koa2 = _interopRequireDefault(_koa);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var BANNER = '######################################################################' + '#                        Welcome to quattuor                         #' + '#                                                                    #' + '#              All connections are monitored and recorded            #' + '#      Disconnect IMMEDIATELY if you are not an authorized user      #' + '######################################################################';
var DELIMITER = 'quattuor$';
var PORT = 3000;

var app = new _koa2.default();

app.use(function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            ctx.body = 'Hey Fart Face!';

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

function listFiles(args, callback) {
  var _this = this;

  _fs2.default.stat('/tmp/world', function (err, stats) {
    if (err) throw err;
    _this.log('stats: ' + JSON.stringify(stats));
    callback();
  });
}

// function say(args, callback) {
//   let str = args.words.join(' ')
//   str = args.options.backwards ? str.split('').reverse().join('') : str
//   this.log(str)
//   callback()
// }

// function start(arg, callback) {
//   server.listen(3000, () => {
//     this.log('quattuor server started – listening on port 3000.')
//     callback()
//   })
// }

var addCommand = function addCommand(_ref2) {
  var command = _ref2.command,
      options = _ref2.options,
      func = _ref2.func;

  var next = server.command(command);
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
  if (options) {
    next = addOptions(next, options);
  }
  next.action(func);
};

var command = {
  command: 'list',
  func: listFiles
};

addCommand(command);

server.show();