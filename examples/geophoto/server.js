/**
* Module dependencies.
*/

var express = require('express')
  , PushpinService = require('./pushpinService')
  , azure = require('./../../lib/azure')
  , socketio = require('socket.io');

var app = module.exports = express.createServer();

PushpinService.createPushpinService(function (pushpinService) {
  // Configuration

  app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
  });

  app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function () {
    app.use(express.errorHandler());
  });

  // Routes
  app.get('/', pushpinService.showPushpins.bind(pushpinService));
  app.post('/create', pushpinService.newPushpin.bind(pushpinService));

  app.listen(process.env.PORT || 1337);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

  var io = socketio.listen(app);

  io.sockets.on('connection', function (socket) {
    // get list of pushpins from the table and emit events for each of them
    pushpinService.getPushpins(function (err, entities) {
      for (var entity in entities) {
        socket.emit('addPushpin', entities[entity]);
      }
    });

    socket.on('clear', function () {
      pushpinService.clearPushpins(function () {
        socket.emit('clear');
      });
    });
  });
});