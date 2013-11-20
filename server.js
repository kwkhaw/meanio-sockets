/**
 * Module dependencies.
 */
var express = require('express'),
    cookie = require('cookie'),
    fs = require('fs'),
    http = require('http'),
    connect = require('connect'),
    io = require('socket.io'),
    passport = require('passport'),
    mongoStore = require('connect-mongo')(express),
    logger = require('mean-logger');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

//Load configurations
//if test env, load example file
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('./config/config'),
    auth = require('./config/middlewares/authorization'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;


//Bootstrap db connection
var db = mongoose.connect(config.db);



//Connection to Mongo tail-capped collections
// var messages = new Schema({
//     title: String,
//     author: String,
//     body: String,
// }, {
//     capped: {
//         size: 1024,
//         max: 1000,
//         autoIndexId: true
//     }
// });


db.connection.on('connected', function() {


    // mongoose.connection.db.collection('question', function());

    mongoose.connection.db.collection('messages', function(err, collection) {
        collection.isCapped(function(err, capped) {
            if (err) {
                console.log('Error when detecting capped collection.  Aborting.  Capped collections are necessary for tailed cursors.');
                process.exit(1);
            }
            if (!capped) {
                console.log(collection.collectionName + ' is not a capped collection. Aborting.  Please use a capped collection for tailable cursors.');
                process.exit(2);
            }
            console.log('Success connecting to messages');
            // console.log('Success connecting to ' + mongoUrl.protocol + '//' + mongoUrl.hostname + '.');
            // startIOServer(collection);
        });
    });


});

// create sessionStore
var sessionStore = new mongoStore({
    db: db.connection.db,
    collection: 'sessions'
});

var sessionSecret = 'MEAN';

//Bootstrap models
var models_path = __dirname + '/app/models';
var walk = function(path) {
    fs.readdirSync(path).forEach(function(file) {
        var newPath = path + '/' + file;
        var stat = fs.statSync(newPath);
        if (stat.isFile()) {
            if (/(.*)\.(js$|coffee$)/.test(file)) {
                require(newPath);
            }
        } else if (stat.isDirectory()) {
            walk(newPath);
        }
    });
};
walk(models_path);

//bootstrap passport config
require('./config/passport')(passport);

var app = express();

//express settings
require('./config/express')(app, passport, sessionStore, sessionSecret);

//Bootstrap routes
require('./config/routes')(app, passport, auth);

//Start the app by listening on <port>
var port = process.env.PORT || config.port;
// app.listen(port);
// console.log('Express app started on port ' + port);
var server = http.createServer(app);
server.listen(port, function() {
    console.log('Express server listening on port ' + port);
});



/**
 * Socket.io
 */
var sio = io.listen(server);

sio.set('authorization', function(data, accept) {
    /* NOTE: To detect which session this socket is associated with,
     *       we need to parse the cookies. */

    if (!data.headers.cookie) {
        return accept('Session cookie required.', false);
    }

    /* XXX: Here be hacks! Both of these methods are part of Connect's
     *      private API, meaning there's no guarantee they won't change
     *      even on minor revision changes. Be careful (but still
     *      use this code!) */
    /* NOTE: First parse the cookies into a half-formed object. */
    data.cookie = cookie.parse(data.headers.cookie);
    //  NOTE: Next, verify the signature of the session cookie. 
    data.cookie = connect.utils.parseSignedCookies(data.cookie, sessionSecret);

    /* NOTE: save ourselves a copy of the sessionID. */
    data.sessionID = data.cookie['express.sid'];
    /* NOTE: get the associated session for this ID. If it doesn't exist,
     *       then bail. */
    sessionStore.get(data.sessionID, function(err, session) {
        if (err) {
            return accept('Error in session store.', false);
        } else if (!session) {
            return accept('Session not found.', false);
        }
        // success! we're authenticated with a known session.
        data.session = session;
        return accept(null, true);
    });
});

sio.sockets.on('connection', function(socket) {
    var hs = socket.handshake;
    console.log('A socket with sessionID ' + hs.sessionID + ' connected.');

    /* NOTE: At this point, you win. You can use hs.sessionID and
     *       hs.session. */

    /* NOTE: This function could end here, and everything would be fine.
     *       However, I included this additional mechanism that Daniel
     *       added to keep the session alive by pinging it every 60
     *       seconds. I don't know how useful this is in the context of
     *       this demo, considering that the sessions aren't going to
     *       expire in the near future. So feel free to not include this: */
    // var intervalID = setInterval(function() {
    //     hs.session.reload(function() {
    //         hs.session.touch().save();
    //     });
    // }, 60 * 1000);
    socket.on('disconnect', function() {
        console.log('A socket with sessionID ' + hs.sessionID + ' disconnected.');
        // clearInterval(intervalID);
    });

});




//Initializing logger
logger.init(app, passport, mongoose);

//expose app
exports = module.exports = app;
