var projects = require('able-projects')

module.exports = {
  get: function (name) {
    return projects[name] || []
  }
}
