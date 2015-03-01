var exec = require('child_process').exec
var fs = require('fs')
var path = require('path')

function clone(url, dir, branch, cb) {
  return exec(
    ['git clone -b', branch, url, dir].join(' '),
    {
      cwd: path.dirname(dir)
    },
    function (err, stdout, stderr) {
      return cb(err, true)
    }
  )
}

function fetch(dir, branch, cb) {
  return exec(
    'git fetch -v origin ' + branch + ' && git reset --hard FETCH_HEAD',
    { cwd: dir },
    function (err, stdout, stderr) {
      if (err) { return cb(err) }
      // TODO: this is a pretty ghetto check
      return cb(null, !(/up to date/.test(stderr)))
    }
  )
}

function cloneOrFetch(url, dir, branch, cb) {
  fs.exists(
    path.join(dir, '.git'),
    function (exists) {
      return exists ?
        fetch(dir, branch, cb) :
        clone(url, dir, branch, cb)
    }
  )
}

module.exports = {
  clone: clone,
  fetch: fetch,
  cloneOrFetch: cloneOrFetch
}
