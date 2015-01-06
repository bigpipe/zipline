describe('zipline', function () {
  'use strict';

  var nightmare = require('nightmare')
    , request = require('request')
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

  it('can be constructed without new keyword', function () {
    assume(Zipline()).is.instanceOf(Zipline);
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

    it('detects gzip support', function () {
      assume(Zipline.accepts(accept)).contains('gzip');
      assume(Zipline.accepts(decline)).is.length(0);
    });

    it('ignores IE6 without service pack', function () {
      accept.headers['user-agent'] = 'Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.1)';

      assume(Zipline.accepts(accept)).is.length(0);
    });

    it('accepts IE6 with a service pack', function () {
      accept.headers['user-agent'] = 'Mozilla/5.0 (Windows; U; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)';

      assume(Zipline.accepts(accept)).contains('gzip');
    });

    it('forces gzip on obfuscated encoding headers', function () {
      headers.forEach(function (header) {
        values.forEach(function (val) {
          var req = { headers: {} };
          req.headers[header] = val;

          assume(Zipline.accepts(req)).contains('gzip');
          assume(Zipline.accepts(req)).contains('deflate');
        });
      });
    });

    it('allows override with cookie', function () {
      accept.headers = { cookie: 'zipline='+ Zipline.major };
      assume(Zipline.accepts(accept)).contains('gzip');

      accept.headers = { cookie: 'zipline=999' };
      assume(Zipline.accepts(accept)).is.length(0);
    });

    it('can use a custom name for cookie detection', function () {
      accept.headers = { cookie: 'hairycowass='+ Zipline.major };
      assume(Zipline.accepts(accept, 'hairycowass')).contains('gzip');
    });

    it('allows override with query string', function () {
      accept.headers = {};
      accept.query = { zipline: Zipline.major };
      assume(Zipline.accepts(accept)).contains('gzip');

      accept.query = { zipline: 999 };
      assume(Zipline.accepts(accept)).is.length(0);
    });

    it('supports node@0.12 rawHeaders', function () {
      accept.headers = {};
      accept.query = {};
      assume(Zipline.accepts(accept)).is.length(0);

      accept.rawHeaders = [
        'user-agent', 'hello world',
        'custom-header', 'silly value',
        headers[3], values[5]
      ];

      assume(Zipline.accepts(accept)).contains('gzip');
    });
  });

  describe('#middleware', function () {
    var ports = 1025
      , server
      , port;

    beforeEach(function (next) {
      port = ports++;

      server = require('http').createServer(function (req, res) {
        if (~(req.headers.cookie || '').indexOf('zipline')) {
          throw new Error('Page was tested before, clear cookies.');
        }

        zipline.middleware()(req, res, function () {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/html');
          require('fs').createReadStream(__dirname + '/test.html').pipe(res);
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

    it('only triggers when the path matches', function (next) {
      request('http://localhost:'+ port +'/lol', function (err, res, body) {
        assume(res.statusCode).equals(500);

        request('http://localhost:'+ port +'/zipline.js', {
          encoding: null
        }, function (err, res, body) {
          assume(body).is.a('buffer');
          assume(res.statusCode).equals(200);
          assume(res.headers['content-encoding']).equals('gzip');
          assume(zipline.buffer).deep.equals(body);

          next();
        });
      });
    });

    it('queues requests until buffer is compiled', function (next) {
      var order = [];

      zipline.once('initialize', function () {
        assume(zipline.buffer).is.not.a('null');

        //
        // Nuke the buffer so the middleware goes in buffer mode.
        //
        zipline.buffer = null;

        zipline.once('initialize', function () {
          order.push('init');
        });

        request('http://localhost:'+ port +'/zipline.js', {
          encoding: null
        }, function (err, res, body) {
          order.push('res');

          assume(body).is.a('buffer');
          assume(res.statusCode).equals(200);
          assume(res.headers['content-encoding']).equals('gzip');
          assume(zipline.buffer).deep.equals(body);
          assume(order.join(',')).equals('init,res');

          next();
        });

        //
        // After sending out the request we want to initialize the zipline again
        // so we start compiling a new `buffer` and flush all queued middleware
        // requests. And yes, this is a super sketchy test, but it works
        // according to the code coverage reports ;-)
        //
        setTimeout(function () {
          zipline.initialize();
        }, 500);
      });
    });

    if (!process.env.NO) it('can load the script through phantom', function (next) {
      this.timeout(10000);
      next = assume.plan(2, next);

      nightmare()
      .goto('http://localhost:'+ port)
      .wait(500)
      .evaluate(function phantomjs() {
        return document.cookie;
      }, function nodejs(cookie) {
        assume(cookie).includes('zipline');
      })
      .evaluate(function phantomjs() {
        return sessionStorage.getItem('zipline');
      }, function nodejs(value) {
        assume(value).equals(Zipline.major);
      })
      .run(next);
    });
  });
});
