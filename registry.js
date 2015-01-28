var async = require('async')
var config = require('./config')
var EventEmitter = require('events').EventEmitter
var exec = require('child_process').exec
var fs = require('fs')
var gh = require('github-url-to-object')
var inherits = require('util').inherits
var log = require('./log')
var path = require('path')

var projectDir = path.resolve(__dirname, config.projects.path)
var registryRepo = gh(config.projects.registry)

var baseBundle = fs.readFileSync(path.resolve(__dirname, 'bundle.js'))
var loadProjects = require('./projects')

function whatevs() { log.debug('whatevs', arguments) }

function clone(url, dir, branch, cb) {
  return exec(
    ['git clone -b', branch, url, dir].join(' '),
    {
      cwd: path.dirname(dir)
    },
    function (err, stdout, stderr) {
      log.debug('clone', { stdout: stdout, stderr: stderr })
      return cb(err, true)
    }
  )
}

function fetch(dir, branch, cb) {
  return exec(
    'git fetch -v origin ' + branch + ' && git reset --hard FETCH_HEAD',
    { cwd: dir },
    function (err, stdout, stderr) {
      if (err) { return cb(err) }
      log.debug('fetch', { stdout: stdout, stderr: stderr })
      // TODO: this is a pretty ghetto check
      return cb(null, !(/up to date/.test(stderr)))
    }
  )
}

function cloneOrFetch(url, dir, branch, cb) {
  fs.exists(
    dir,
    function (exists) {
      return exists ?
        fetch(dir, branch, cb) :
        clone(url, dir, branch, cb)
    }
  )
}

function updateProjects(cb) {
  fs.readFile(
    path.resolve(projectDir, 'package.json'),
    function (err, data) {
      if (err) { return cb(err) }
      try {
        var pkg = JSON.parse(data)
        var projects = pkg.able || []
        async.map(
          projects,
          function (project, done) {
            var projectRepo = gh(project)
            var dir = path.resolve(projectDir, projectRepo.repo)
            cloneOrFetch(projectRepo.https_url, dir, projectRepo.branch, done)
          },
          function (err, results) {
            cb(err, (results && results.indexOf(true) > -1))
          }
        )
      }
      catch(e) { return cb(e) }
    }
  )
}

function Registry() {
  EventEmitter.call(this)
  this.projects = {}
  this.checkTimer = null
}
inherits(Registry, EventEmitter)

Registry.prototype.watch = function () {
  this.stop()
  this.update(
    function (err) {
      if (err) {
        log.error('registry.watch', err)
      }
      this.checkTimer = setTimeout(this.watch.bind(this), 30000)
    }.bind(this)
  )
}

Registry.prototype.stop = function () {
  clearTimeout(this.checkTimer)
  this.checkTimer = null
}

Registry.prototype.update = function (cb) {
  cb = cb || whatevs
  return cloneOrFetch(
    registryRepo.https_url,
    projectDir,
    registryRepo.branch,
    function (err) {
      if (err) { return cb(err) }
      updateProjects(
        function (err, changed) {
          if (changed) {
            this.emit('changed')
          }
          return cb(err)
        }.bind(this)
      )
    }.bind(this)
  )
}

Registry.prototype.load = function (cb) {
  if (!registryRepo) {
    // no registry, just load from the directory
    this.projects = loadProjects(projectDir)
    return cb()
  }
  this.update(
    function (err) {
      if (err) {
        return cb(err)
      }
      this.projects = loadProjects(projectDir)
      this.checkTimer = setTimeout(this.watch.bind(this), 30000)
      this.on(
        'changed',
        function () {
          this.projects = loadProjects(projectDir)
        }.bind(this)
      )
      cb()
    }.bind(this)
  )
}

Registry.prototype.project = function (name) {
  return this.projects[name] || { experiments: [], defaults: {}, source: '[]' }
}

Registry.prototype.experiments = function (name) {
  return this.project(name).experiments
}

Registry.prototype.bundle = function (name, subject) {
  var p = this.project(name)
  return baseBundle +
  'var able = new Able({' +
  'remoteNow:' + Date.now() + ',' +
  'defaults:' + JSON.stringify(p.defaults) + ',' +
  'subject:' + JSON.stringify(subject) + ',' +
  'experiments:' + p.source +
  '});'
}

module.exports = new Registry()

if (require.main === module) {
  module.exports.watch()
}
