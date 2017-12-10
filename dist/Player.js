"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _groove = _interopRequireDefault(require("groove"));

var _aplay = _interopRequireDefault(require("aplay"));

var _sox = _interopRequireDefault(require("sox"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return _get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var instance = null;

var Player =
/*#__PURE__*/
function () {
  _createClass(Player, null, [{
    key: "meta",
    value: function () {
      var _ref = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee(filePath) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt("return", new Promise(function (resolve, reject) {
                  _groove.default.open(filePath, function (err, file) {
                    if (err) {
                      reject(err);
                    }

                    var metadata = file.metadata();
                    var duration = file.duration();
                    file.close(function (err) {
                      if (err) {
                        reject(err);
                      }

                      resolve(_extends({}, metadata, {
                        duration: duration
                      }));
                    });
                  });
                }));

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function meta(_x) {
        return _ref.apply(this, arguments);
      }

      return meta;
    }()
  }]);

  function Player() {
    _classCallCheck(this, Player);

    if (instance) {
      return instance;
    }

    _groove.default.connectSoundBackend();

    var playlist = _groove.default.createPlaylist();

    var player = _groove.default.createPlayer();

    player.useExactAudioFormat = true;
    this._files = [];
    this._playlist = playlist;
    this._player = player;
    instance = this;
    return instance;
  }

  _createClass(Player, [{
    key: "play",
    value: function play(filePath) {
      if (!filePath) {
        return this;
      }

      this._attachPlaylist();

      return;

      if (Object.is(filePath, this._filePath)) {
        return _get(Player.prototype.__proto__ || Object.getPrototypeOf(Player.prototype), "play", this).call(this, this._filePath);
      }

      this._filePath = filePath;
      return _get(Player.prototype.__proto__ || Object.getPrototypeOf(Player.prototype), "play", this).call(this, this._filePath);
    }
  }, {
    key: "filePath",
    value: function filePath() {
      return this._filePath;
    }
  }, {
    key: "_attachPlaylist",
    value: function () {
      var _ref2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee2() {
        var _this = this;

        var playlist;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                playlist = this._playlist;
                console.log(this._player, this.playlist);
                return _context2.abrupt("return", new Promise(function (resolve, reject) {
                  _this._player.attach(playlist, function (err) {
                    if (err) {
                      reject(err);
                    }

                    console.log(_this._player, _this.playlist);
                    resolve();
                  });
                }));

              case 3:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _attachPlaylist() {
        return _ref2.apply(this, arguments);
      }

      return _attachPlaylist;
    }()
  }]);

  return Player;
}();

exports.default = Player;