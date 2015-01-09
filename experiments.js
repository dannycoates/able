var fs = require('fs')
var path = require('path')
var projects = require('able-projects')

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
  bundle: function (name) {
    var p = getProject(name)
    return baseBundle +
    ';Able.serverLoadedAt = ' + Date.now() + ';' +
    'var able = new Able({' +
    'loadUrl:"/v1/my/experiments",' +
    'saveUrl:"/v1/my/experiments",' +
    'defaults:' + JSON.stringify(p.defaults) + ',' +
    'experiments:[' +
    p.experiments.map(
      function (x) { return experimentDefinition(x) }
    ).join(',') +
    ']});'
  }
}

module.exports = experiments
