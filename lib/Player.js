import groove from 'groove'
import keese from 'keese'

// Number of player files to keep open
const OPEN_FILE_COUNT = 8
const PREV_FILE_COUNT = Math.floor(OPEN_FILE_COUNT / 2)
const NEXT_FILE_COUNT = OPEN_FILE_COUNT - PREV_FILE_COUNT

let instance = null

export default class Player {
  static meta(filePath) {
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

    this._playlist = groove.createPlaylist() // The groove playlist
    this._playlist.pause()
    this._player = null

    this.state = {
      currentTrack: null, // current groove item that is playing
      currentTrackStartDate: null,
      ignoreEndOfPlaylistSentinel: true,
      isPlaying: false,
      items: {}, // map of playlist items by id (e.g. { [id]: item })
      pausedTime: null,
      pendingPlayerAttachDetach: false,
      playlist: {}, //
      tracksInOrder: [],
      volume: this._playlist.gain,
    }

    instance = this
    return instance
  }

  initializePlayer() {
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

  async play() {
    if (!this._player) {
      await this.initializePlayer()
    }

    if (!this.state.currentTrack) {
      this.state.currentTrack = this.state.tracksInOrder[0]
    } else if (!this.state.isPlaying) {
      this.state.currentTrackStartDate = new Date(new Date() - this.pausedTime * 1000)
    }
    this._playlist.play()
    this.state.isPlaying = true

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

  pause() {
    if (!this.state.isPlaying) {
      return
    }
    this.state.isPlaying = true
    this.state.pausedTime = (new Date() - this.state.currentTrackStartDate) / 1000
    this._playlist.pause()

    // playlistChanged(this) // TODO: Implement update to playlist function
    this.currentTrackChanged()
  }

  stop() {
    this.state.isPlaying = false
    this._playlist.pause()
    this.state.pausedTime = 0
    this.state.currentTrackStartDate = null

    // playlistChanged(this) // TODO: Implement update to playlist function
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
      // playlistChanged(this) // TODO: Implement update to playlist function
      this.currentTrackChanged()
    } else if (!decodeHead.item) {
      if (this.state.ignoreEndOfPlaylistSentinel) {
        // both play head and decode head are null. end of playlist.
        // log.debug('end of playlist')
        this.state.currentTrack = null
        // playlistChanged(this) // TODO: Implement update to playlist function
        this.currentTrackChanged()
      }
    }
  }

  _playlistChanged() {
    // Generate this.state.tracksInOrder from this._playlist
    const s = (a, b) => {
      const aSortKey = a.sortKey
      const bSortKey = b.sortKey
      return aSortKey < bSortKey ? -1 : aSortKey > bSortKey ? 1 : 0
    }
    const m = (track, index) => {
      track.index = index
      return track
    }
    const ids = Object.keys(this._playlist)
    const tracksInOrder = Object.values(this._playlist)
      .sort(s)
      .map(m)

    // Disambiguate Sort Keys
    let previousUniqueKey = null
    let previousKey = null
    tracksInOrder.forEach((track, i) => {
      if (track.sortKey === previousKey) {
        // move the repeat back
        track.sortKey = keese(previousUniqueKey, track.sortKey)
        previousUniqueKey = track.sortKey
      } else {
        previousUniqueKey = previousKey
        previousKey = track.sortKey
      }
    })
    this.state.tracksInOrder = tracksInOrder

    // Preload tracks if necessary
    if (this.state.currentTrack) {
      // Preload tracks that are upcoming, close items that should be closed out
      this.state.tracksInOrder.forEach((track, index) => {
        const prevDiff = this.state.currentTrack.index - index
        const nextDiff = index - this.state.currentTrack.index
        const withinPrev = prevDiff <= PREV_FILE_COUNT && prevDiff >= 0
        const withinNext = nextDiff <= NEXT_FILE_COUNT && nextDiff >= 0
        const shouldHaveGrooveFile = withinPrev || withinNext
        const hasGrooveFile = track.grooveFile != null || track.pendingGrooveFile
        if (hasGrooveFile && !shouldHaveGrooveFile) {
          this.state.playlistItemCloseQueue.push(track)
        } else if (!hasGrooveFile && shouldHaveGrooveFile) {
          this._preloadFile(track)
        }
      })
    } else {
      // Player not playing
      this.state.isPlaying = false
      this.state.currentTrackStartDate = null
      this.state.pausedTime = 0
    }

    checkUpdateGroovePlaylist(self)
    performGrooveFileDeletes(self)

    checkPlayCount(self)
    // TODO: Emit queue update
  }

  _checkUpdateGroovePlaylist() {
    if (!this.currentTrack) {
      this.groovePlaylist.clear()
      this.grooveItems = {}
    }
  }
}
