var AB = require('abatar')
var xhr = require('xhr')

function Able(options) {
  this.loadUrl = options.loadUrl
  this.saveUrl = options.saveUrl
  this.defaults = options.defaults || {}
  this.ab = AB.create(options.experiments, [], Able.now())
  this.subject = this.ab.subject
}

// this gets overwritten externally with the server's Date.now()
Able.serverLoadedAt = Date.now()
// client's local loaded time (for syncing with server time)
Able.clientLoadedAt = Date.now()

Able.now = function () {
  // all experiment time comparisons should be based off of server time.
  // Able.serverLoadedAt gets set on the server when the js is "rendered".
  // Able.clientLoadedAt gets set on the client when this file is initialized.
  // For our purposes we can consider these two times to be "equal", so to get
  // the current server time at any point we can just add the difference
  // of the load times to the current client time.
  var delta = Able.serverLoadedAt - Able.clientLoadedAt
  return Date.now() + delta
}

Able.prototype.authenticate = function (token, cb) {
  this.auth = token
  this.load(cb)
}

Able.prototype.load = function (cb) {
  if (!this.auth) {
    // TODO load locally
    return cb()
  }
  var able = this
  xhr(
    {
      url: this.loadUrl,
      headers: {
        Authorization: 'Bearer ' + this.auth
      },
      json: true
    },
    function (err, res, experiments) {
      if (err || res.statusCode !== 200) {
        return cb(new Error('authentication failed'))
      }
      for (var i = 0; i < experiments.length; i++) {
        able.ab.enroll(experiments[i], Able.now())
      }
      cb()
    }
  )
}

Able.prototype.save = function (cb) {
  if (!this.auth) {
    // TODO save locally
    return cb()
  }
  xhr(
    {
      method: 'PUT',
      url: this.saveUrl,
      headers: {
        Authorization: 'Bearer ' + this.auth
      },
      json: this.ab.enrolled.names()
    },
    function (err, res, body) {
      if (err || res.statusCode !== 200) {
        return cb(new Error('save failed'))
      }
      cb()
    }
  )
}

Able.prototype.choose = function (variable, subject) {
  return this.ab.choose(variable, subject, Able.now()) || this.defaults[variable]
}

Able.prototype.report = function () {
  return this.ab.report()
}

module.exports = Able
