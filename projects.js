var glob = require('glob')
var path = require('path')

function loadExperiments(dirname) {
  var filenames = glob.sync(dirname + '/**/*.js')
  var experiments = []
  for (var i = 0; i < filenames.length; i++) {
    experiments.push(require(filenames[i]))
  }
  return experiments
}

function loadProject(pkgFilename, projects) {
  var dirname = path.dirname(pkgFilename)
  var pkg = require(pkgFilename)
  projects[pkg.name] = {
    experiments: loadExperiments(dirname),
    defaults: require(dirname + '/defaults.json')
  }
}

module.exports = function (projectsPath) {
  var projects = {}
  var pkgFilenames = glob.sync(projectsPath + '/*/package.json')
  for (var i = 0; i < pkgFilenames.length; i++) {
    loadProject(pkgFilenames[i], projects)
  }
  return projects
}
