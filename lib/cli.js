'use strict';

var _vorpal = require('vorpal');

var _vorpal2 = _interopRequireDefault(_vorpal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var vorpal = (0, _vorpal2.default)();

function say(args, callback) {
  var str = args.words.join(' ');
  str = args.options.backwards ? str.split('').reverse().join('') : str;
  this.log(str);
  callback();
}

vorpal.command('say [words...]').option('-b, --backwards').option('-t, --twice').action(say);

vorpal.delimiter('quattuor$').show();