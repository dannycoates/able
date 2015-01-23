var config = require('./config')
var mozlog = require('mozlog')
mozlog.config({
  app: 'ab-server',
  level: config.log.level,
  fmt: config.log.fmt
})
module.exports = mozlog('ab')
