var fs = require('fs')
var path = require('path')
var config = require('./config')
var projects = require('./projects')(config.projects.path)

// TODO: only loading baseBundle this way while I figure other things out
var baseBundle = fs.readFileSync(path.resolve(__dirname, 'bundle.js'))

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
    'experiments:' + p.source +
    '});'
  }
}

module.exports = experiments
