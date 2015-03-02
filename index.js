var Project = require('./project')

module.exports = function (projectDir, gitUrl, cb) {
  Project.load(
    projectDir,
    gitUrl,
    function (err, project) {
      if (err) { return cb(err) }
      return cb(null, project.ab.bind(project))
    }
  )
}
