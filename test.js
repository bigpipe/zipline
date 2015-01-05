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

  describe('#accepts', function () {
    var accept = {
      headers: {
        'if-none-match': '1313',
        'if-modified-since': new Date().toUTCString(),
        'accept-encoding': 'gzip,deflate,cakes',
      },
      url: '/foo/bar.banana',
      method: 'GET'
    };

    var decline = {
      url: '/',
      headers: {}
    };

    it('detects gzip support', function () {
      assume(Zipline.accepts(accept)).equals('gzip');
      assume(Zipline.accepts(decline)).is.a('undefined');
    });

    it('ignores IE6 without service pack', function () {
      accept.headers['user-agent'] = 'Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.1)';

      assume(Zipline.accepts(accept)).is.a('undefined');
    });

    it('accepts IE6 with a service pack', function () {
      accept.headers['user-agent'] = 'Mozilla/5.0 (Windows; U; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)';

      assume(Zipline.accepts(accept)).equals('gzip');
    });

    it('forces gzip on obfuscated encoding headers', function () {
      var headers = [
        'Accept-EncodXng',
        'X-cept-Encoding',
        'XXXXXXXXXXXXXXX',
        '~~~~~~~~~~~~~~~',
        '---------------'
      ];

      var values = [
        'gzip',
        'deflate',
        'gzip,deflate',
        'deflate,gzip',
        'XXXXXXXXXXXXX',
        '~~~~~~~~~~~~~',
        '-------------'
      ];

      headers.forEach(function (header) {
        values.forEach(function (val) {
          var req = { headers: {} };
          req.headers[header] = val;

          assume(Zipline.accepts(req)).is.not.a('undefined');
        });
      });
    });
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
