import Vorpal from 'vorpal'

const vorpal = Vorpal()

function say(args, callback) {
  let str = args.words.join(' ')
  str = args.options.backwards ? str.split('').reverse().join('') : str
  this.log(str)
  callback()
}

vorpal.command('say [words...]').option('-b, --backwards').option('-t, --twice').action(say)

vorpal.delimiter('quattuor$').show()
