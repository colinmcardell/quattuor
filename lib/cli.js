import 'babel-polyfill'

import Vantage from 'vantage'
import Koa from 'koa'
import fs from 'fs'

const BANNER =
  '######################################################################' +
  '#                        Welcome to quattuor                         #' +
  '#                                                                    #' +
  '#              All connections are monitored and recorded            #' +
  '#      Disconnect IMMEDIATELY if you are not an authorized user      #' +
  '######################################################################'
const DELIMITER = 'quattuor$'
const PORT = 3000

const app = new Koa()

app.use(async (ctx) => {
  ctx.body = 'Hey Fart Face!'
})

const server = Vantage().delimiter(DELIMITER).banner(BANNER).listen(app, PORT)

function listFiles(args, callback) {
  fs.stat('/tmp/world', (err, stats) => {
    if (err) throw err
    this.log(`stats: ${JSON.stringify(stats)}`)
    callback()
  })
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

const addCommand = ({ command, options, func }) => {
  let next = server.command(command)
  const addOptions = (cmd, opts) => {
    const [first, ...rest] = opts
    let option = cmd.option(first)
    rest.forEach((element) => {
      option = option.option(element)
    })
    return option
  }
  if (options) {
    next = addOptions(next, options)
  }
  next.action(func)
}

const command = {
  command: 'list',
  func: listFiles,
}

addCommand(command)

server.show()
