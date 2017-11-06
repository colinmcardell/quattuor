import Sound from 'aplay'
import Sox from 'sox'

export default class Player extends Sound {
  static async meta(filePath) {
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
