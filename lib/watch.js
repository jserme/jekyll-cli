/*!
 * Watch the changes
 */

/*jshint node:true, asi:true, expr:true */

'use strict';

var resolve = require('path').resolve
var relative = require('path').relative
var http = require('http')
var send = require('send')
var watchr = require('watchr')
var spawn = require('./utils/spawn')
var then = require('./utils/then')
require('js-yaml')
require('colors')

module.exports = function() {
  new Watch()
}

function Watch() {
  var _this = this
  var cwd = process.cwd()
  var config = require(resolve(cwd, '_config.yml'))
  var dest = resolve(cwd, config.destination || '_site')

  _this.cwd = cwd
  _this.dest = dest
  _this.port = config.server_port || '4000'

  // start watching
  watchr.watch({
    path: cwd,
    ignorePaths: [dest, resolve(cwd, 'node_modules')],
    listener: function(changeType, fullPath) {
      console.log('[%s] %s'.cyan, changeType, relative(cwd, fullPath))

      clearTimeout(_this.timer)
      _this.timer = setTimeout(function() {
        _this.generate()
      }, 1000)
    },
    next: then(function() {
      _this.generate(true)
    })
  })
}

// generate static files
Watch.prototype.generate = function(startServer) {
  var _this = this

  startServer || console.log('Regenerating...'.grey)

  spawn('jekyll', ['--no-server', '--no-auto'], {
    cwd: _this.cwd,
    stdout: false,
    exit: function(code) {
      if (code === 0) {
        console.log('Successfully generated.'.green)
        startServer && _this.server()
      }
    }
  })
}

// start a web server
Watch.prototype.server = function() {
  var _this = this

  http.createServer(function(req, res) {
    send(req, req.url).root(_this.dest).pipe(res)
  }).listen(_this.port)

  console.log(
    'Your blog is running at http://localhost:%s/. Press Ctrl+C to stop.'.green,
    _this.port
  )
}