var boom = require('boom')
var hapi = require('hapi')
var config = require('../../config')

var server = new hapi.Server()

server.connection({
  host: config.oauth.host,
  port: config.oauth.port
})

server.route([
  {
    method: 'GET',
    path: '/__heartbeat__',
    handler: function (req, reply) { reply() }
  },
  {
    method: 'POST',
    path: '/v1/verify',
    handler: function (req, reply) {
      var token = req.payload.token
      var words = token.split('-')
      var creds = {
        user: words[0],
        client_id: words[1],
        scope: words[2]
      }
      if (creds.user === 'bad') {
        return reply({ code: 400, message: 'Invalid token'}).code(400)
      }
      reply(creds)
    }
  }
])

server.start()
