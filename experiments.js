var fs = require('fs')
var path = require('path')
var config = require('./config')
var projects = require('./projects')(config.projects.path)

// TODO: only loading baseBundle this way while I figure other things out
var baseBundle = fs.readFileSync(path.resolve(__dirname, 'bundle.js'))

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

function getProject(name) {
  return projects[name] || { experiments: [], defaults: {}}
}

var experiments = {
  get: function (name) {
    return getProject(name).experiments
  },
  bundle: function (name, subject) {
    var p = getProject(name)
    return baseBundle +
    'var able = new Able({' +
    'remoteNow:' + Date.now() + ',' +
    'defaults:' + JSON.stringify(p.defaults) + ',' +
    'subject:' + JSON.stringify(subject) + ',' +
    'experiments:[' +
    p.experiments.map(
      function (x) { return experimentDefinition(x) }
    ).join(',') +
    ']});'
  }
}

module.exports = experiments
