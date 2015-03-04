var config = require('../config')
var boom = require('boom')
var path = require('path')

/*/
    Logging configuration
/*/
var log = require('../log')

/*/
    Experiments
/*/
var Registry = require('../registry')
var registry = new Registry(
  path.resolve(__dirname, '..', config.projects.path),
  config.projects.registry
)
/*/
    HTTP server configuration
/*/
var hapi = require('hapi')
var server = new hapi.Server({
  connections: {
    routes: {
      cors: true
    }
  }
})

server.connection({
  host: config.server.host,
  port: config.server.port
})

server.register(
  {
    register: require('hapi-fxa-oauth'),
    options: {
      host: config.oauth.host,
      port: config.oauth.port,
      insecure: config.oauth.insecure
    }
  },
  function (err) {
    if (err) {
      log.critical('plugin', { err: err })
      process.exit(8)
    }
  }
)

function getAB(uid, app, enrolled, cb) {
  cb(null, registry.project(app).ab(enrolled))
}

server.route([
  {
    method: 'GET',
    path: '/test/{app}',
    handler: function (req, reply) {
      reply('<html><head><script src="../v1/' +
        req.params.app +
        '/experiments.bundle.js"></script></head></html>').type('text/html')
    }
  },
  {
    method: 'GET',
    path: '/v1/{app}/experiments.bundle.js',
    handler: function (req, reply) {
      reply(
        registry.bundle(
          req.params.app,
          {
            clientAddress: req.info.remoteAddress
          }
        )
      ).type('application/javascript')
    }
  },
  {
    method: 'GET',
    path: '/v1/{app}/attributes',
    handler: function (req, reply) {
      getAB(null, req.params.app, [],
        function (err, ab) {
          if (err) { return reply(boom.badImplementation()) }
          reply(ab.attributes())
        }
      )
    }
  },
  {
    method: 'POST',
    path: '/v1/{app}/variables/{variable}',
    config: {
      auth: {
        strategy: 'fxa-oauth',
        scope: ['ab'],
        mode: 'optional'
      }
    },
    handler: function (req, reply) {
      if (req.auth.isAuthenticated) {
        var uid = req.auth.credentials.user
        getAB(uid, req.params.app, req.payload.enrolled || [],
          function (err, ab) {
            if (err) { return reply(boom.badImplementation()) }
            ab.subject.uid = uid
            var v = req.params.variable
            var results = {}
            results[v] = ab.choose(v, req.payload.subject)
            //db.put(uid, JSON.stringify(ab.enrolled.names()), function () {})
            reply(results)
          }
        )
      }
      else {
        getAB(null, req.params.app, req.payload.enrolled || [],
          function (err, ab) {
            if (err) { return reply(boom.badImplementation()) }
            var v = req.params.variable
            var results = {}
            results[v] = ab.choose(v, req.payload.subject)
            reply(results)
          }
        )
      }
    }
  },
  {
    method: 'POST',
    path: '/v1/{app}/variables',
    config: {
      auth: {
        strategy: 'fxa-oauth',
        scope: ['ab'],
        mode: 'optional'
      }
    },
    handler: function (req, reply) {
      if (req.auth.isAuthenticated) {
        var uid = req.auth.credentials.user
        getAB(uid, req.params.app, req.payload.enrolled || [],
          function (err, ab) {
            if (err) { return reply(boom.badImplementation()) }
            var vars = ab.variables() //TODO shuffle?
            ab.subject.uid = uid
            var results = {}
            for (var i = 0; i < vars.length; i++) {
              var v = vars[i]
              results[v] = ab.choose(v, req.payload.subject)
            }
            //db.put(uid, JSON.stringify(ab.enrolled.names()), function () {})
            reply(results)
          }
        )
      }
      else {
        getAB(null, req.params.app, req.payload.enrolled || [],
          function (err, ab) {
            if (err) { return reply(boom.badImplementation()) }
            var vars = ab.variables() //TODO shuffle?
            var results = {}
            for (var i = 0; i < vars.length; i++) {
              var v = vars[i]
              results[v] = ab.choose(v, req.payload.subject)
            }
            reply(results)
          }
        )
      }
    }
  }
])

/*/
    Start your engines
/*/

registry.load(
  function (err) {
    if (err) {
      log.critical('registry.load', err)
      return process.exit(8)
    }
    server.start(
      function () {
        log.info(
          'server.start',
          {
            host: config.server.host,
            port: config.server.port
          }
        )
      }
    )
  }
)

/*/
    ^C graceful shutdown
/*/

process.on(
  'SIGINT',
  function () {
    registry.stopAll()
    server.stop(log.info.bind(log, 'shutdown'))
  }
)
