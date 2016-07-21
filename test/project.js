var tap = require('tap')
var Project = require('../project')

tap.test('properly sets git configuration', function (t) {
  var root = '.'
  var gitConfig = 'github:mozilla/fxa-content-experiments#dev'
  var project = new Project(root, gitConfig)
  var git = project.git

  t.equal(git.clone_url, 'https://github.com/mozilla/fxa-content-experiments')
  t.equal(git.branch, 'dev')
  t.equal(git.repo, 'fxa-content-experiments')
  t.equal(git.https_url, 'https://github.com/mozilla/fxa-content-experiments/blob/dev')
  t.equal(git.clone_url, 'https://github.com/mozilla/fxa-content-experiments')
  t.end()
})
