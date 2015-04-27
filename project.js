var abatar = require('abatar')
var async = require('async')
var fs = require('fs')
var gh = require('github-url-to-object')
var gitUtil = require('./git-util')
var glob = require('glob')
var path = require('path')

var baseBundle = fs.readFileSync(path.resolve(__dirname, 'bundle.js'))

function Project(root, gitUrl) {
  this.root = root
  this.gitUrl = gitUrl
  this.git = this.gitUrl ? gh(this.gitUrl) : {}
  this.package = null
  this.experiments = []
  this.defaults = {}
  this.name = ''
  this.src = null
  this.watchTimer = null
}

Project.prototype.pull = function (cb) {
  gitUtil.cloneOrFetch(
    this.git.https_url,
    this.root,
    this.git.branch,
    cb
  )
}

Project.prototype.load = function (cb) {
  async.map(
    [
      path.join(this.root, 'package.json'),
      path.join(this.root, 'defaults.json')
    ],
    function readJSON(filename, next) {
      fs.readFile(
        filename,
        function (err, file) {
          if (err) { return next(err) }
          try {
            next(null, JSON.parse(file))
          }
          catch (e) {
            next(e)
          }
        }
      )
    },
    function (err, objects) {
      if (err) { return cb(err) }
      this.package = objects[0]
      this.defaults = objects[1]
      this.name = this.package.name
      loadExperiments(
        this.root,
        function (err, experiments) {
          if (err) { return cb(err) }
          this.src = null
          this.experiments = experiments
          cb(null, this)
        }.bind(this)
      )
    }.bind(this)
  )
}

Project.prototype.pullAndLoad = function (cb) {
  this.pull(
    function (err, changed) {
      if (err) { return cb(err) }
      return (changed || !this.package) ?
        this.load(cb) :
        cb(null, this)
    }.bind(this)
  )
}

Project.prototype.stop = function () {
  clearTimeout(this.watchTimer)
  this.watchTimer = null
}

Project.prototype.watch = function (cb) {
  this.stop()
  this.pullAndLoad(
    function (err) {
      this.watchTimer = setTimeout(this.watch.bind(this), 30000)
      if (cb) { return cb(err, this) }
    }.bind(this)
  )
}

Project.prototype.source = function () {
  if (!this.src) {
    this.src = '[' + this.experiments.map(experimentDefinition).join(',') + ']'
  }
  return this.src
}

Project.prototype.ab = function (enrolled) {
  return abatar.create({
    defaults: this.defaults,
    enrolled: enrolled || [],
    experiments: this.experiments
  })
}

Project.prototype.bundle = function (reportUrl, subject) {
  return baseBundle +
    'var able = new Able({' +
    'remoteNow:' + Date.now() + ',' +
    'defaults:' + JSON.stringify(this.defaults) + ',' +
    'subject:' + JSON.stringify(subject) + ',' +
    'experiments:' + this.source() + ',' +
    'reportUrl:"' + reportUrl + '"' +
    '});'
}

Project.load = function (options, cb) {
  var project = new Project(options.dirname, options.gitUrl)
  if (options.gitUrl) {
    if (options.watch) {
      project.watch(cb)
    }
    else {
      project.pullAndLoad(cb)
    }
  }
  else {
    project.load(cb)
  }
}

function loadExperiments(dirname, cb) {
  glob(
    dirname + '/**/*.js',
    function (err, filenames) {
      if (err) { return cb(err) }
      async.map(
        filenames,
        function (filename, next) {
          // We may be loading new code from a file previously loaded so we must
          // delete the existing source from the `require` cache. In general
          // this is a horrible idea, however we want the ability to update
          // experiments without restarting the server. Since experiments have a
          // known, limited structure (they don't have any `require`s themselves)
          // its a reasonable action to take.
          delete require.cache[filename]
          try {
            next(null, require(filename))
          } catch (e) {
            next(e)
          }
        },
        cb
      )
    }
  )
}

function experimentDefinition(x) {
  x._eligibilityFunction = null
  x._groupingFunction = null
  var efn = x.eligibilityFunction || 'null'
  var gfn = x.groupingFunction || 'null'
  return JSON.stringify(x)
    .replace(
      /"_eligibilityFunction":null/,
      '"eligibilityFunction":' + efn.toString()
    )
    .replace(
      /"_groupingFunction":null/,
    '"groupingFunction":' + gfn.toString()
    )
}

module.exports = Project
