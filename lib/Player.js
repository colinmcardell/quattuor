import groove from 'groove'

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

    this._files = []
    this._playlist = groove.createPlaylist() // The groove playlist
    this._player = null

    this.state = {
      currentTrack: null, // current groove item that is playing
      currentTrackStartDate: null,
      ignoreEndOfPlaylistSentinel: true,
      items: {}, // map of playlist items by id (e.g. { [id]: item })
      pendingPlayerAttachDetach: false,
      volume: this._playlist.gain,
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
        this._player.deviceIndex = null // Setting deviceIndex to null defaults the player to playback to the system default hardware
        this._player.attach(this._playlist, (err) => {
          this.state.pendingPlayerAttachDetach = false
          if (err) {
            return reject(err)
          }
          this._player.on('nowplaying', this._onNowPlaying)
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

  setVolume(value) {
    value = Math.min(2.0, value)
    value = Math.max(0.0, value)
    this.state.volume = value
    this._playlist.setGain(value)
    // TODO: Emit volume update
  }

  filePath() {
    return this._filePath
  }

  _openFile(filePath) {
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

  currentTrackChanged() {
    // TODO: Emit track change
  }

  _onNowPlaying() {
    return
    const playHead = this._player.position()
    const decodeHead = this._playlist.position()
    if (playHead.item) {
      const nowMs = new Date().getTime()
      const posMs = playHead.pos * 1000
      const currentTrackStartDate = new Date(nowMs - posMs)
      const currentTrack = this.state.items[playHead.item.id]

      this.state.currentTrack = currentTrack
      this.state.currentTrackStartDate = currentTrackStartDate
      // playlistChanged(self) // TODO: Implement update to playlist function
      this.currentTrackChanged()
    } else if (!decodeHead.item) {
      if (this.state.ignoreEndOfPlaylistSentinel) {
        // both play head and decode head are null. end of playlist.
        // log.debug('end of playlist')
        this.state.currentTrack = null
        // playlistChanged(self) // TODO: Implement update to playlist function
        this.currentTrackChanged()
      }
    }
  }
}
