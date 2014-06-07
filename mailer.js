'use strict';

var nodemailer = require('nodemailer');
var transport = null;

exports.setup = function(settings) {
  transport = nodemailer.createTransport('SMTP', {
    host: settings.host,
    secureConnection: true,
    port: 465,
    auth: {
        user: settings.user,
        pass: settings.password
    }
  });
};

exports.send = function(params, callback) {
  transport.sendMail(params, function(err) {
    if ( err ) {
      return callback( err );
    }
    return callback( null, { message: 'OK' } );
  });
};