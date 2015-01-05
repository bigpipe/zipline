describe('zipline', function () {
  'use strict';

  var nightmare = require('nightmare')
    , assume = require('assume')
    , Zipline = require('./')
    , zipline;

  beforeEach(function () {
    zipline = new Zipline();
  });

  afterEach(function () {
    zipline.destroy();
  });

  it('is exposed as function', function () {
    assume(Zipline).to.be.a('function');
  });

  it('exposes the parser as function', function () {
    assume(Zipline.accepts).is.a('function');
  });

  it('emits an initialize event once the buffer is added', function (next) {
    zipline.once('initialize', function () {
      assume(zipline.buffer).is.a('buffer');
      next();
    });

    assume(zipline.buffer).is.a('null');
  });

  describe('.middleware', function () {
    var ports = 1025
      , server
      , port;

    beforeEach(function (next) {
      port = ports++;

      server = require('http').createServer(function (req, res) {
        zipline.middleware(req, res, function () {
          res.statusCode = 500;
          res.end('something went wrong');
        });
      });

      server.listen(port, next);
    });

    afterEach(function (next) {
      server.close(next);
    });

    it('exposes the middleware as function property', function () {
      assume(zipline.middleware).is.a('function');
    });

    it('returns a middleware layer', function () {
      assume(zipline.middleware()).is.a('function');
    });
  });
});
