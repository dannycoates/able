var glob = require('glob')
var path = require('path')

function experimentDefinition(x) {
  x._eligibilityFunction = null
  x._groupingFunction = null
  return JSON.stringify(x)
    .replace(
      /"_eligibilityFunction":null/,
      '"eligibilityFunction":' + x.eligibilityFunction.toString()
    )
    .replace(
      /"_groupingFunction":null/,
    '"groupingFunction":' + x.groupingFunction.toString()
    )
}

function createSource(experiments) {
  return '[' + experiments.map(experimentDefinition).join(',') + ']'
}

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
  var experiments = loadExperiments(dirname)
  projects[pkg.name] = {
    experiments: experiments,
    defaults: require(dirname + '/defaults.json'),
    source: createSource(experiments)
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
