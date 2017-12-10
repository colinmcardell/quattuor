import '@babel/polyfill'

import Vantage from 'vantage'
import Express from 'express'
import fs from 'fs'
import path from 'path'

import Player from './Player'

const BANNER =
  '######################################################################\n' +
  '#                        Welcome to quattuor                         #\n' +
  '######################################################################'
const DELIMITER = 'quattuor$'
const PORT = 3000
const FILES_PATH = 'assets'

const app = new Express()

const player = new Player()

const server = Vantage()
  .delimiter(DELIMITER)
  .banner(BANNER)
  .listen(app, PORT)

server.addCommand = ({
  command, options, description, action,
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
  next.action(action)
}

/** File System Helpers */
const readFiles = async (filesPath = FILES_PATH) => {
  const fullFilesPath = path.resolve(process.cwd(), filesPath)
  const dirContent = fs.readdirSync(fullFilesPath)
  return Promise.all(dirContent.map(async (file) => {
    const fullPath = `${fullFilesPath}/${file}`
    const meta = await Player.meta(fullPath)
    const { sampleCount, bitRate, ...rest } = meta
    return {
      ...rest,
      name: file,
      path: fullPath,
    }
  }))
}
/** File System Helpers - End */

/** Commands */
const ls = async () => JSON.stringify(await readFiles(), null, 2)

const play = (filePath) => {
  player.play(filePath)
}

const pause = () => {
  player.pause()
}

const resume = () => {
  player.resume()
}

const stop = () => {
  player.stop()
}
/** Commands - End */

/** CLI Actions */
async function lsAction(args, callback) {
  const result = await ls()
  this.log(result)
  callback()
}

async function playAction(args, callback) {
  let filePath = args && args.options && args.options.file
  if (!filePath) {
    /* eslint-disable prefer-destructuring */
    const files = await readFiles()
    const file = files[0]
    /* eslint-enable prefer-destructuring */
    filePath = file.path
  }
  play(filePath)
  this.log(`Playing – ${player.filePath()}`)
  callback()
}

function pauseAction(args, callback) {
  pause()
  this.log(`Pausing Playback – ${player.filePath()}`)
  callback()
}

function resumeAction(args, callback) {
  resume()
  this.log(`Resuming Playback – ${player.filePath()}`)
  callback()
}

function stopAction(args, callback) {
  stop()
  this.log('Stop Playback')
  callback()
}
/** CLI functions - End */

/** Add CLI Commands */
[
  {
    command: 'ls',
    description: 'List available audio files for playback.',
    action: lsAction,
  },
  {
    command: 'play',
    description: 'Plays to provided audio file.',
    options: ['-f --file'],
    action: playAction,
  },
  {
    command: 'pause',
    description: 'Pauses the currently playing audio file.',
    action: pauseAction,
  },
  {
    command: 'resume',
    description: 'Resumes playback of the current audio file.',
    action: resumeAction,
  },
  {
    command: 'stop',
    description: 'Stops playback of the current audio file.',
    action: stopAction,
  },
].forEach((cmd) => {
  server.addCommand(cmd)
})
/** Add CLI Commands - End */

app.get('/ls', async (req, res) => {
  const files = await readFiles()
  res.send(files)
})

app.get('/', (req, res) => {
  // server.exec('play')
  res.send(BANNER)
})

server.show()
