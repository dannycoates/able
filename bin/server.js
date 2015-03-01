var config = require('../config')
var boom = require('boom')
var AB = require('abatar')

/*/
    Logging configuration
/*/
var log = require('../log')

/*/
    Database configuration
/*/
var level = require('level')
var db = level(config.db.path)

/*/
    Experiments
/*/
var registry = require('../registry')
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

function getEnrolled(uid, cb) {
  if (!uid) { return cb(null, []) }
  db.get(
    uid,
    function (err, value) {
      if (err && !err.notFound) {
        return cb(err)
      }
      cb(null, value ? JSON.parse(value) : [])
    }
  )
}

function getAB(uid, app, sessionEnrolled, cb) {
  getEnrolled(
    uid,
    function (err, enrolled) {
      if (err) { return cb(err) }
      return cb(null, AB.create(registry.experiments(app), enrolled.concat(sessionEnrolled)))
    }
  )
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
    path: '/v1/my/experiments',
    config: {
      auth: {
        strategy: 'fxa-oauth',
        scope: ['ab']
      }
    },
    handler: function (req, reply) {
      db.get(
        req.auth.credentials.user,
        function (err, value) {
          if (err && !err.notFound) {
            return reply(err)
          }
          reply(value || '[]').type('application/json')
        }
      )
    }
  },
  {
    method: 'PUT',
    path: '/v1/my/experiments',
    config: {
      auth: {
        strategy: 'fxa-oauth',
        scope: ['ab']
      },
      payload: {
        parse: 'gunzip'
      }
    },
    handler: function (req, reply) {
      // TODO validation / merge
      db.put(
        req.auth.credentials.user,
        req.payload,
        reply
      )
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
            db.put(uid, JSON.stringify(ab.enrolled.names()), function () {})
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
            db.put(uid, JSON.stringify(ab.enrolled.names()), function () {})
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
    if (err) { return process.exit(8) }
    server.start()
  }
)

/*/
    ^C graceful shutdown
/*/

process.on(
  'SIGINT',
  function () {
    registry.stop()
    server.stop(
      function () {
        db.close(log.info.bind(log, 'shutdown'))
      }
    )
  }
)
