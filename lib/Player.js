import groove from 'groove'
import Sound from 'aplay'
import Sox from 'sox'

let instance = null

export default class Player {
  static async meta(filePath) {
    return new Promise((resolve, reject) => {
      groove.open(filePath, (err, file) => {
        if (err) {
          reject(err)
        }
        const metadata = file.metadata()
        const duration = file.duration()
        file.close((err) => {
          if (err) {
            reject(err)
          }
          resolve({
            ...metadata,
            duration,
          })
        })
      })
    })
  }

  constructor() {
    if (instance) {
      return instance
    }

    const version = groove.getVersion()
    // console.log(version)

    const playlist = groove.createPlaylist()
    const player = groove.createPlayer()
    player.useExactAudioFormat = true

    this._files = []
    this._playlist = playlist
    this._player = null

    this.state = {
      pendingPlayerAttachDetach: false,
    }

    instance = this
    return instance
  }

  async initializePlayer() {
    return new Promise((resolve, reject) => {
      if (this.state.pendingPlayerAttachDetach) {
        return resolve()
      }

      const onDetachComplete = (err) => {
        if (err) {
          return reject(err)
        }
        this._player = groove.createPlayer()
        this._player.deviceIndex = null
        this._player.attach(this._playlist, (err) => {
          this.state.pendingPlayerAttachDetach = false
          if (err) {
            return reject(err)
          }
          resolve()
        })
      }

      this.state.pendingPlayerAttachDetach = true
      if (this._player) {
        this._player.removeAllListeners()
        this._player.detach(onDetachComplete)
      } else {
        onDetachComplete()
      }
    })
  }

  async play(filePath) {
    if (!filePath) {
      return this
    }
    if (!this._player) {
      await this.initializePlayer()
    }

    const f = await this._openFile(filePath)
    const file = {
      file: f,
      path: filePath,
    }

    this._files.push(file)

    const playlistItem = this._playlist.insert(f)
    this._playlist.seek(playlistItem)
    this._playlist.play()
  }

  filePath() {
    return this._filePath
  }

  async _attachPlaylist() {
    return new Promise((resolve, reject) => {
      const playlist = this._playlist
      if (playlist.playing()) {
        resolve()
        return
      }
      this._player.attach(playlist, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async _openFile(filePath) {
    return new Promise((resolve, reject) => {
      groove.open(filePath, (err, file) => {
        if (err) {
          reject(err)
        } else {
          resolve(file)
        }
      })
    })
  }
}
