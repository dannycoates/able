var async = require('async')
var fs = require('fs')
var gh = require('github-url-to-object')
var gitUtil = require('./git-util')
var glob = require('glob')
var path = require('path')
var Project = require('./project')

function projectsFromArray(projects) {
  projects = projects || []
  var result = {}
  for (var i = 0; i < projects.length; i++) {
    var project = projects[i]
    result[project.name] = project
  }
  return result
}

function loadProjects(dirname, cb) {
  fs.readFile(
    path.resolve(dirname, 'package.json'),
    function (err, data) {
      if (err) { return cb(err) }
      try {
        async.map(
          JSON.parse(data).able || [],
          function (project, done) {
            Project.load(
              path.resolve(dirname, gh(project).repo),
              project,
              done
            )
          },
          function (err, projects) {
            cb(err, projectsFromArray(projects))
          }
        )
      }
      catch(e) { return cb(e) }
    }
  )
}

function Registry(projectDir, registryUrl) {
  this.projectDir = projectDir
  this.git = registryUrl ? gh(registryUrl) : null
  this.projects = {}
  this.watchTimer = null
  this.loaded = false
}

Registry.prototype.clean = function () {

}

Registry.prototype.watch = function (cb) {
  this.stop()
  this.pull(
    function (err) {
      this.watchTimer = setTimeout(this.watch.bind(this), 30000)
      if (cb) { cb(err, this) }
    }.bind(this)
  )
}

Registry.prototype.stop = function () {
  clearTimeout(this.watchTimer)
  this.watchTimer = null
}

Registry.prototype.stopProjects = function () {
  this.all().forEach(function (p) { p.stop() })
}

Registry.prototype.stopAll = function () {
  this.stop()
  this.stopProjects()
}

Registry.prototype.pull = function (cb) {
  gitUtil.cloneOrFetch(
    this.git.https_url,
    this.projectDir,
    this.git.branch,
    function (err, changed) {
      if (err || (!changed && this.loaded)) { return cb(err) }
      this.stopProjects()
      loadProjects(
        this.projectDir,
        function (err, projects) {
          if (err) { return cb(err) }
          this.projects = projects
          this.loaded = true
          cb()
        }.bind(this)
      )
    }.bind(this)
  )
}

Registry.prototype.loadProjectsFromDir = function (cb) {
  glob(
    this.projectDir + '/*/package.json',
    function (err, pkgFilenames) {
      if (err) { return cb(err) }
      async.map(
        pkgFilenames,
        function (filename, next) {
          Project.load(path.dirname(filename), null, next)
        },
        function (err, projects) {
          if (err) { return cb (err) }
          this.projects = projectsFromArray(projects)
          this.loaded = true
          cb(null, this)
        }.bind(this)
      )
    }.bind(this)
  )
}

Registry.prototype.load = function (cb) {
  return this.git ?
    this.watch(cb) :
    this.loadProjectsFromDir(cb)
}

Registry.prototype.all = function () {
  return Object.keys(this.projects).map(
    function (name) {
      return this.projects[name]
    }.bind(this)
  )
}

Registry.prototype.project = function (name) {
  return this.projects[name] || new Project()
}

Registry.prototype.bundle = function (name, subject) {
  return this.project(name).bundle(subject)
}

module.exports = Registry

