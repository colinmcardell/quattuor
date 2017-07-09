"use strict";

var _vorpal = require("vorpal");

var _vorpal2 = _interopRequireDefault(_vorpal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var vorpal = (0, _vorpal2.default)();

vorpal.command("say [words...]").option("-b, --backwards").option("-t, --twice").action(function (args, callback) {
  var str = args.words.join(" ");
  str = args.options.backwards ? str.split("").reverse().join("") : str;
  undefined.log(str);
  callback();
});

vorpal.delimiter("quattuor$").show();