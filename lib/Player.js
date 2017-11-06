import Sound from 'aplay'

export default class Player extends Sound {
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
