var fs = require('fs')
var path = require('path')
var projects = require('able-projects')
// TODO: only loading baseBundle this way while I figure other things out
var baseBundle = fs.readFileSync(path.resolve(__dirname, 'node_modules/abatar/bundle.js'))

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

var experiments = {
  get: function (name) {
    return projects[name] || []
  },
  bundle: function (name) {
    return baseBundle +
    ';\nvar ab = AB.create([' +
    experiments.get(name).map(
      function (x) { return experimentDefinition(x) }
    ).join(',') +
    ']);console.log(ab)'
  }
}

module.exports = experiments
