import groove from 'groove'
import keese from 'keese'

// Number of player files to keep open
const OPEN_FILE_COUNT = 8
const PREV_FILE_COUNT = Math.floor(OPEN_FILE_COUNT / 2)
const NEXT_FILE_COUNT = OPEN_FILE_COUNT - PREV_FILE_COUNT

// Player Repeat States
export const Repeat = Object.freeze({
  OFF: Symbol('off'),
  ALL: Symbol('all'),
  ONE: Symbol('one'),
})

// Helper Functions
const fileOpen = filePath =>
  new Promise((resolve, reject) => {
    groove.open(filePath, (err, file) => {
      if (err) {
        reject(err)
      } else {
        resolve(file)
      }
    })
  })

const fileClose = file =>
  new Promise((resolve, reject) => {
    file.close((err) => {
      if (err) {
        reject()
      } else {
        resolve()
      }
    })
  })

// Helper Functions - End

let instance = null

export default class Player {
  static async meta(filePath) {
    try {
      const file = await fileOpen(filePath)
      const metadata = file.metadata()
      const duration = file.duration()
      const meta = {
        ...metadata,
        duration,
      }
      await fileClose(file)
      return meta
    } catch (err) {
      throw err
    }
  }

  constructor() {
    if (instance) {
      return instance
    }

    // const version = groove.getVersion()
    // console.log(version)

    this._playlist = groove.createPlaylist() // The groove playlist
    this._playlist.pause()
    this._player = null

    const volume = this._playlist.gain
    this.state = {
      currentTrack: null, // current groove item that is playing
      currentTrackStartDate: null,
      ignoreEndOfPlaylistSentinel: true,
      initialized: false,
      isPlaying: false,
      items: {}, // map of playlist items by id (e.g. { [id]: item })
      pausedTime: null,
      pendingPlayerAttachDetach: false,
      playlist: {}, // Player playlist which is a representation of the groove playlist
      repeat: Repeat.OFF,
      seekRequestPos: -1, // Set to >= 0 when you want to seek to a position
      tracksInOrder: [],
      volume,
    }

    instance = this
    return instance
  }

  // Async function that should be called to set up the player instance before
  // enqueueing and playback
  start() {
    return new Promise((resolve, reject) => {
      if (this.state.initialized) {
        return resolve()
      }
      if (this.state.pendingPlayerAttachDetach) {
        return resolve()
      }

      const onDetachComplete = (err) => {
        if (err) {
          return reject(err)
        }
        this._player = groove.createPlayer()
        // Setting deviceIndex to null defaults the player to playback to the
        // system default hardware
        this._player.deviceIndex = null
        return this._player.attach(this._playlist, (error) => {
          this.state.pendingPlayerAttachDetach = false
          if (error) {
            return reject(error)
          }
          this._player.on('nowplaying', this._onNowPlaying)
          return resolve()
        })
      }

      this.state.pendingPlayerAttachDetach = true
      if (this._player) {
        this._player.removeAllListeners()
        return this._player.detach(onDetachComplete)
      }
      return onDetachComplete()
    })
  }

  setVolume(value) {
    let volume = value
    volume = Math.min(2.0, volume)
    volume = Math.max(0.0, volume)
    this.state.volume = volume
    this._playlist.setGain(volume)
    // TODO: Emit volume update
  }

  play() {
    if (!this.state.initialized) {
      // TODO: Emit Error
      return
    }

    if (!this.state.currentTrack) {
      const currentTrack = this.state.tracksInOrder[0]
      this.state.currentTrack = currentTrack
    } else if (!this.state.isPlaying) {
      this.state.currentTrackStartDate = new Date((new Date() - this.pausedTime) * 1000)
    }
    this._playlist.play()
    this.state.isPlaying = true
    this._playlistChanged()
    this._currentTrackChanged()

    // const f = await this._openFile(filePath)
    // const file = {
    //   file: f,
    //   path: filePath,
    // }
    //
    // this._files.push(file)
    //
    // const playlistItem = this._playlist.insert(f)
    // this._playlist.seek(playlistItem)
    // this._playlist.play()
  }

  pause() {
    if (!this.state.isPlaying) {
      return
    }
    this.state.isPlaying = true
    this.state.pausedTime = (new Date() - this.state.currentTrackStartDate) / 1000
    this._playlist.pause()

    this._playlistChanged()
    this._currentTrackChanged()
  }

  stop() {
    this.state.isPlaying = false
    this._playlist.pause()
    this.state.pausedTime = 0
    this.state.currentTrackStartDate = null

    this._playlistChanged()
  }

  filePath() {
    return this._filePath
  }

  _currentTrackChanged() {
    console.log('Current Track Changed: ', this)
    // TODO: Emit track change
  }

  _onNowPlaying() {
    const playHead = this._player.position()
    const decodeHead = this._playlist.position()
    if (playHead.item) {
      const nowMs = new Date().getTime()
      const posMs = playHead.pos * 1000
      const currentTrackStartDate = new Date(nowMs - posMs)
      const currentTrack = this.state.items[playHead.item.id]

      this.state.currentTrack = currentTrack
      this.state.currentTrackStartDate = currentTrackStartDate
      this._playlistChanged()
      this._currentTrackChanged()
    } else if (!decodeHead.item) {
      if (this.state.ignoreEndOfPlaylistSentinel) {
        // both play head and decode head are null. end of playlist.
        // log.debug('end of playlist')
        this.state.currentTrack = null
        this._playlistChanged()
        this._currentTrackChanged()
      }
    }
  }

  // Update to playlist occurred, sync player playlist with groove playlist
  _playlistChanged() {
    // Generate this.state.tracksInOrder from this._playlist
    const sort = (a, b) => {
      const l = a.sortKey < b.sortKey
      const r = a.sortKey > b.sortKey
      if (l) {
        return -1
      }
      if (r) {
        return 1
      }
      return 0
    }
    const assignIndex = (track, index) => {
      const value = track
      value.index = index
      return value
    }
    // Disambiguate Sort Keys
    let previousUniqueKey = null
    let previousKey = null
    const disSortKeys = (track) => {
      const value = track
      if (value.sortKey === previousKey) {
        // move the repeat back
        value.sortKey = keese(previousUniqueKey, value.sortKey)
        previousUniqueKey = track.sortKey
      } else {
        previousUniqueKey = previousKey
        previousKey = value.sortKey
      }
      return value
    }
    const tracksInOrder = Object.values(this._playlist)
      .sort(sort)
      .map(assignIndex)
      .map(disSortKeys)
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

    this._checkUpdateGroovePlaylist()
    performGrooveFileDeletes(self)

    checkPlayCount(self)
    // TODO: Emit queue update
  }

  _removeItem(id) {
    const { items } = this.state
    const value = Object.assign({}, items)
    delete value[id]
    this.state.items = value
  }

  _addItem({ id, item }) {
    const { items } = this.state
    const newItems = {
      ...items,
      [id]: item,
    }
    this.state.items = newItems
  }

  // Update groove playlist
  _checkUpdateGroovePlaylist() {
    const groovePlaylist = this._playlist
    const { currentTrack } = this.state

    if (!currentTrack) {
      groovePlaylist.clear()
      this.state.items = {}
      return
    }

    let groovePlIndex = 0
    let grooveItem

    let plItemIndex = currentTrack.index
    let plTrack
    let currentGrooveItem = null // might be different than playHead.item
    let groovePlItemCount = 0
    let gainAndPeak

    const playlistItems = groovePlaylist.items()
    const playHead = this._player.position()
    const playHeadItemId = playHead.item && playHead.item.id

    // _checkUpdateGroovePlaylist - Helper Functions
    const incrementPlIndex = () => {
      groovePlItemCount += 1
      if (this.state.repeat !== Repeat.ONE) {
        plItemIndex += 1
        if (this.state.repeat === Repeat.ALL && plItemIndex >= this.state.tracksInOrder.length) {
          plItemIndex = 0
        }
      }
    }
    // _checkUpdateGroovePlaylist - Helper Functions: End

    if (playHeadItemId) {
      while (groovePlIndex < playlistItems.length) {
        grooveItem = playlistItems[groovePlIndex]
        if (grooveItem.id === playHeadItemId) break
        // this groove playlist item is before the current playhead. delete it!
        groovePlaylist.remove(grooveItem)
        this._removeItem(grooveItem.id)
        groovePlIndex += 1
      }
    }

    while (groovePlIndex < playlistItems.length) {
      grooveItem = playlistItems[groovePlIndex]
      const grooveTrack = this.state.items[grooveItem.id]
      // now we have deleted all items before the current track. we are now
      // comparing the libgroove playlist and the player playlist
      // side by side.
      plTrack = this.state.tracksInOrder[plItemIndex]
      if (grooveTrack === plTrack) {
        // if they're the same, we advance
        // but we might have to correct the gain
        // gainAndPeak = calcGainAndPeak(plTrack)
        // groovePlaylist.setItemGain(grooveItem, gainAndPeak.gain)
        // groovePlaylist.setItemPeak(grooveItem, gainAndPeak.peak)
        currentGrooveItem = currentGrooveItem || grooveItem
        groovePlIndex += 1
        incrementPlIndex()
      } else {
        // this groove track is wrong. delete it.
        groovePlaylist.remove(grooveItem)
        this._removeItem(grooveItem.id)
        groovePlIndex += 1
      }
    }

    // we still need to add more libgroove playlist items, but this one has
    // not yet finished loading from disk. We must take note of this so that
    // if we receive the end of playlist sentinel, we start playback again
    // once this track has finished loading.
    this.state.ignoreEndOfPlaylistSentinel = false
    while (groovePlItemCount < NEXT_FILE_COUNT) {
      plTrack = this.state.tracksInOrder[plItemIndex]
      if (!plTrack) {
        // we hit the end of the groove basin playlist. we're done adding tracks
        // to the libgroove playlist.
        this.state.ignoreEndOfPlaylistSentinel = true
        break
      }
      if (!plTrack.grooveFile) {
        break
      }
      // compute the gain adjustment
      // gainAndPeak = calcGainAndPeak(plTrack)
      // grooveItem = groovePlaylist.insert(plTrack.grooveFile, gainAndPeak.gain, gainAndPeak.peak)
      grooveItem = groovePlaylist.insert(plTrack.grooveFile)
      this._addItem({
        id: grooveItem.id,
        item: plTrack,
      })
      currentGrooveItem = currentGrooveItem || grooveItem
      incrementPlIndex()
    }

    if (currentGrooveItem && this.state.seekRequestPos >= 0) {
      const { seekRequestPos } = this.state
      // we want to clear encoded buffers after the seek completes, e.g. after
      // we get the end of playlist sentinel
      // self.clearEncodedBuffer()
      // self.queueClearEncodedBuffers = true
      groovePlaylist.seek(currentGrooveItem, seekRequestPos)
      this.state.seekRequestPos = -1
      if (this.state.isPlaying) {
        const nowMs = new Date().getTime()
        const posMs = seekRequestPos * 1000
        this.state.trackStartDate = new Date(nowMs - posMs)
      } else {
        this.state.pausedTime = seekRequestPos
      }
      this._currentTrackChanged()
    }

    // function calcGainAndPeak(plTrack) {
    //   // if the previous item is the previous item from the album, or the
    //   // next item is the next item from the album, use album replaygain.
    //   // else, use track replaygain.
    //   const dbFile = self.libraryIndex.trackTable[plTrack.key]
    //   const albumMode = albumInfoMatch(-1) || albumInfoMatch(1)
    //
    //   let gain = REPLAYGAIN_PREAMP
    //   let peak
    //   if (dbFile.replayGainAlbumGain != null && albumMode) {
    //     gain *= dBToFloat(dbFile.replayGainAlbumGain)
    //     peak = dbFile.replayGainAlbumPeak || 1.0
    //   } else if (dbFile.replayGainTrackGain != null) {
    //     gain *= dBToFloat(dbFile.replayGainTrackGain)
    //     peak = dbFile.replayGainTrackPeak || 1.0
    //   } else {
    //     gain *= REPLAYGAIN_DEFAULT
    //     peak = 1.0
    //   }
    //   return { gain, peak }
    //
    //   function albumInfoMatch(dir) {
    //     const otherPlTrack = self.tracksInOrder[plTrack.index + dir]
    //     if (!otherPlTrack) return false
    //
    //     const otherDbFile = self.libraryIndex.trackTable[otherPlTrack.key]
    //     if (!otherDbFile) return false
    //
    //     const albumMatch =
    //       self.libraryIndex.getAlbumKey(dbFile) === self.libraryIndex.getAlbumKey(otherDbFile)
    //     if (!albumMatch) return false
    //
    //     // if there are no track numbers then it's hardly an album, is it?
    //     if (dbFile.track == null || otherDbFile.track == null) {
    //       return false
    //     }
    //
    //     const trackMatch = dbFile.track + dir === otherDbFile.track
    //     if (!trackMatch) return false
    //
    //     return true
    //   }
    // }
  }
}
