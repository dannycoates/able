var glob = require('glob')
var path = require('path')

function Experiments() {
  this.apps = {}
}

Experiments.prototype.get = function (name) {
  return this.apps[name] || []
}

Experiments.prototype.load = function (cb) {
  glob(
    'projects/**/*.js',
    function (err, filenames) {
      if (err) { return cb(err) }
      for (var i = 0; i < filenames.length; i++) {
        var filename = filenames[i]
        var filepath = filename.split(path.sep)
        var app = filepath[1]
        var experiments = this.apps[app] || []
        // TODO not quite right but works for now
        experiments.push(require(path.resolve(__dirname, filename)))
        this.apps[app] = experiments
      }
      console.warn(Object.keys(this.apps))
      return cb()
    }.bind(this)
  )
}

module.exports = new Experiments()
