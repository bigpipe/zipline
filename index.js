'use strict';

var destroy = require('demolish')
  , path = require('path')
  , zlib = require('zlib')
  , fs = require('fs');

var obfheader = /^(Accept-EncodXng|X-cept-Encoding|X{15}|~{15}|-{15})$/i
  , obfvalue = /^((gzip|deflate)s*,?s*(gzip|deflate)?|X{4,13}|~{4,13}|-{4,13})$/;

/**
 * Zipline: An GZIP detection utility.
 *
 * @constructor
 * @param {Object} options Optional configuration of your zipline.
 * @api public
 */
function Zipline(options) {
  if (!this) return new Zipline(options);
  options = options || {};

  this.pathname = options.pathname || '/zipline.js';
  this.name = options.name || 'zipline';
  this.buffer = null;

  this.initialize();
}

//
// Inherit from EventEmitter3 so we can queue middleware requests while we're
// still compiling the line.
//
Zipline.prototype.__proto__ = require('eventemitter3').prototype;

/**
 * Initialize the GZIP buffer.
 *
 * @api private
 */
Zipline.prototype.initialize = function initialize(options) {
  var line = fs.readFileSync(path.join(__dirname, 'line.js'), 'utf-8')
  .replace('{zipline:major}', Zipline.major)
  .replace('{zipline:minor}', Zipline.minor)
  .replace('{zipline:patch}', Zipline.patch)
  .replace('{zipline:name}', this.name)
  .replace(/[\n|\r]+/g, '')
  .replace(/\s{2,}/, '');

  zlib.gzip(new Buffer(line), function gzipped(err, buffer) {
    if (err) return this.emit('error', err);

    this.buffer = buffer;
    this.emit('initialize');
  }.bind(this));
};

/**
 * Return a middleware layer which parse the accept headers.
 *
 * @returns {Function}
 * @api public
 */
Zipline.prototype.middleware = function middleware() {
  var zipline = this;

  return function layer(req, res, next) {
    req[zipline.name] = Zipline.accepts(req, zipline.name);

    if (zipline.pathname !== req.url) return next();
    if (!zipline.buffer) return zipline.once('initialize', layer.bind(layer, req, res, next));

    res.statusCode = 200;
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Type', 'text/javascript');
    res.setHeader('Content-Length', zipline.buffer.length);

    res.end(zipline.buffer);
  };
};

/**
 * Completely destroy and clean up the Zipline instance.
 *
 * @type {Function}
 * @returns {Boolean}
 * @api public
 */
Zipline.prototype.destroy = destroy('name, buffer, pathname', {
  after: 'removeAllListeners'
});

/**
 * Parse the Accept-Encoding headers and figure if the user supports any form of
 * deflation.
 *
 * @param {Request} req Incoming HTTP request.
 * @param {String} name Name of the zipline cookie we need to search for.
 * @returns {Array}
 * @api public
 */
Zipline.accepts = function accepts(req, name) {
  name = name || 'zipline';

  var i, value
    , raw = req.rawHeaders || []
    , headers = req.headers || {}
    , line = name +'='+ Zipline.major
    , ua = (headers['user-agent'] || '');

  //
  // Detect broken gzip encoding on Internet Explorer 5 & 6.
  //
  // @see sebduggan.com/blog/ie6-gzip-bug-solved-using-isapirewrite
  //
  if (ua && /msie\s[5|6]/i.test(ua) && !/sv1/i.test(ua)) {
    return [];
  }

  //
  // No obfuscation, assume that it's intact and that we can test against it.
  //
  if (headers['accept-encoding']) {
    return headers['accept-encoding'].split(',');
  }

  //
  // Attempt to detect obfuscated encoding headers, which is the least
  // common case here but caused by firewalls.
  //
  // @see developer.yahoo.com/blogs/ydn/posts/2010/12/pushing-beyond-gzipping
  //
  if (!raw.length) for (i in headers) {
    if (obfheader.test(i) && obfvalue.test(headers[i])) {
      return ['gzip', 'deflate'];
    }
  } else for (i = 0; i < raw.length; i++) {
    if (obfheader.test(raw[i]) && obfvalue.exec(raw[i + 1])) {
      return ['gzip'];
    }

    //
    // We need to increment the iteration as the raw headers are stored as
    // [key, value, key, value] and we're only interested in testing the key's
    // not the values.
    //
    i++;
  }

  //
  // Check for the bypass cookie or query string which can be set to force gzip.
  //
  if (
       headers.cookie && ~headers.cookie.indexOf(line)
    || 'object' === typeof req.query && req.query[name] === Zipline.major
  ) {
    return ['gzip'];
  }

  return [];
};

/**
 * Parsed version number of the module which is needed for tagging the things.
 *
 * @type {String}
 * @public
 */
Zipline.major = '0';
Zipline.minor = '0';
Zipline.patch = '0';

require('./package.json').version.split('.').forEach(function each(version, i) {
  Zipline[this[i]] = version;
}, ['major', 'minor', 'patch']);

//
// Expose the Zipline interface.
//
module.exports = Zipline;
