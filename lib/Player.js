import Sound from 'aplay'
import Sox from 'sox'
import Loudness from 'loudness'

export default class Player extends Sound {
  static meta(filePath) {
    return new Promise((resolve, reject) => {
      Sox.identify(filePath, (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }

  // Volume between value of 0.0 and 1.0
  static setVolume(volume = 0.25) {
    let v = volume
    v = Math.min(1.0, v)
    v = Math.max(0.0, v)
    return new Promise((resolve, reject) => {
      Loudness.setVolume(v * 100.0, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(v)
        }
      })
    })
  }

  static getVolume() {
    return new Promise((resolve, reject) => {
      Loudness.getVolume((err, vol) => {
        if (err) {
          reject(err)
        } else {
          resolve(vol)
        }
      })
    })
  }

  constructor() {
    super()
    this._filePath = null
  }

  play(filePath) {
    if (!filePath) {
      this._filePath = null
      return this
    }
    if (Object.is(filePath, this._filePath)) {
      return super.play(this._filePath)
    }
    this._filePath = filePath
    return super.play(this._filePath)
  }

  filePath() {
    return this._filePath
  }
}
