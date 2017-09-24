import 'babel-polyfill'

import Vantage from 'vantage'
import Koa from 'koa'
import fs from 'fs'
import path from 'path'

import Sound from 'aplay'
import Sox from 'sox'

const BANNER =
  '######################################################################\n' +
  '#                        Welcome to quattuor                         #\n' +
  '######################################################################'
const DELIMITER = 'quattuor$'
const PORT = 3000
const FILES_PATH = 'assets'

let audioFile = null

const app = new Koa()

app.use(async (ctx) => {
  play()
  ctx.body = 'BANNER'
})

const server = Vantage()
  .delimiter(DELIMITER)
  .banner(BANNER)
  .listen(app, PORT)
server.addCommand = ({
  command, options, description, func,
}) => {
  let next = server.command(command)
  /* eslint-disable no-unused-expressions */
  description && next.description(description)
  /* eslint-enable no-unused-expressions */
  const addOptions = (cmd, opts) => {
    const [first, ...rest] = opts
    let option = cmd.option(first)
    rest.forEach((element) => {
      option = option.option(element)
    })
    return option
  }
  next = (options && addOptions(next, options)) || next
  next.action(func)
}

const player = new Sound()
player.on('complete', () => {
  server.log(`Playback Complete – ${audioFile.path}`)
})

/** File System Helpers */
const readFiles = (filesPath = FILES_PATH) => {
  const fullFilesPath = path.resolve(process.cwd(), filesPath)
  return fs.readdirSync(fullFilesPath).map((file) => {
    const fullPath = `${fullFilesPath}/${file}`
    return {
      path: fullPath,
    }
  })
}

/** File System Helpers - End */

/** CLI functions */
function ls(args, callback) {
  const files = JSON.stringify(readFiles())
  this.log(files)
  callback()
}

function play(args, callback) {
  audioFile = args.options.file || readFiles()[0]
  this.log(`Playing – ${audioFile.path}`)
  player.play(audioFile.path)
  callback()
}

function pause(args, callback) {
  this.log(`Pausing Playback – ${audioFile.path}`)
  player.pause()
  callback()
}

function resume(args, callback) {
  this.log(`Resuming Playback – ${audioFile.path}`)
  player.resume()
  callback()
}
/** CLI functions */

server.addCommand({
  command: 'ls',
  description: 'List available audio files for playback.',
  func: ls,
})

server.addCommand({
  command: 'play',
  description: 'Plays to provided audio file using "aplay".',
  options: ['-f --file'],
  func: play,
})

server.addCommand({
  command: 'pause',
  description: 'Pauses the currently playing audio file.',
  func: pause,
})

server.addCommand({
  command: 'resume',
  description: 'Resumes playback of the current audio file.',
  func: resume,
})

server.show()
