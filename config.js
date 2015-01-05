var convict = require('convict')

var config = convict(
  {
    log: {
      level: {
        format: String,
        default: 'info'
      },
      fmt: {
        format: String,
        default: 'heka'
      }
    },
    server: {
      host: {
        format: 'ipaddress',
        default: '127.0.0.1'
      },
      port: {
        format: 'port',
        default: 9798
      }
    },
    db: {
      path: {
        format: String,
        default: './abdb'
      }
    },
    oauth: {
      host: {
        format: String,
        default: 'oauth.accounts.firefox.com'
      },
      port: {
        format: 'port',
        default: 443
      },
      insecure: {
        format: Boolean,
        default: false
      }
    }
  }
)

try {
  config.loadFile('./config.json')
}
catch (e) {}

config.validate()

module.exports = config.root()
