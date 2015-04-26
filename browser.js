var AB = require('abatar')
var inherits = require('inherits')
var xhr = require('xhr')

function Able(options) {
  AB.call(this, options)
  this.reportUrl = options.reportUrl
}
inherits(Able, AB)

Able.prototype.sendReport = function (cb) {
  xhr(
    {
      method: 'POST',
      url: this.reportUrl,
      json: this.report()
    },
    cb
  )
}

module.exports = Able
