var fs = require('fs')
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
    var filename = filenames[i]
    // We may be loading new code from a file previously loaded so we must
    // delete the existing source from the `require` cache. In general
    // this is a horrible idea, however we want the ability to update
    // experiments without restarting the server. Since experiments have a
    // known, limited structure (they don't have any `require`s themselves)
    // its a reasonable action to take.
    delete require.cache[filename]
    // WE SHOULD BE EXTREMELY CAREFUL HANDLING THE REFERENCES TO THIS ARRAY
    experiments.push(require(filename))
  }
  return experiments
}

function loadProject(pkgFilename, projects) {
  var dirname = path.dirname(pkgFilename)
  var pkg = JSON.parse(fs.readFileSync(pkgFilename))
  var experiments = loadExperiments(dirname)
  projects[pkg.name] = {
    experiments: experiments,
    defaults: JSON.parse(fs.readFileSync(dirname + '/defaults.json')),
    source: createSource(experiments)
  }
}

module.exports = function (projectsPath) {
  // TODO desyncify
  var projects = {}
  var pkgFilenames = glob.sync(projectsPath + '/*/package.json')
  for (var i = 0; i < pkgFilenames.length; i++) {
    loadProject(pkgFilenames[i], projects)
  }
  return projects
}
