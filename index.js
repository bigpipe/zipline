'use strict';

//
// The major release version of this plugin which is used as value for the
// cookie check.
//
var major = require('./package.json').version.split('.').shift()
  , line = require('fs').readFileSync(__dirname +'/line.gz');

/**
 * Check if the given headers support gzip or deflate for compression.
 *
 * @param {Object} headers Headers of the incoming request.
 * @returns {String|Undefined}
 * @api private
 */
function zipline(headers) {
  //
  // Check for the bypass cookie which can be set
  //
  if (headers.cookie && ~headers.cookie.indexOf('zipline='+ major)) {
    return 'gzip';
  }

  var obfheader = /^(Accept-EncodXng|X-cept-Encoding|X{15}|~{15}|-{15})$/i
    , obfvalue = /^((gzip|deflate)\s*,?\s*)+|[X\~\-]{4,13}$/i
    , ua = (headers['user-agent'] || '')
    , key, value;

  //
  // Detect broken gzip encoding on Internet Explorer 5 & 6.
  //
  // @see sebduggan.com/blog/ie6-gzip-bug-solved-using-isapirewrite
  //
  if (ua && /msie\s[5|6]/i.test(ua) && !/sv1/i.test(ua)) {
    return undefined;
  }

  //
  // No obfuscation, assume that it's intact and that we can test against it.
  //
  if ((value = obfvalue.exec(headers['accept-encoding'] || ''))) {
    return value[1];
  }

  //
  // Attempt to detect obfuscated encoding headers, which is the least
  // common case here but caused by firewalls.
  //
  // @see developer.yahoo.com/blogs/ydn/posts/2010/12/pushing-beyond-gzipping
  //
  for (key in headers) {
    if (obfheader.test(key) && (value = obfvalue.exec(headers[key]))) {
      return value[1];
    }
  }

  return undefined;
}

/**
 * Respond to /zipline.js requests in addition to automatically adding
 * a `zipline` property to the incoming HTTP request.
 *
 * @param {Request} req Incoming HTTP request.
 * @param {Response} res Outgoing HTTP response.
 * @param {Function} next Continuation callback.
 * @api public
 */
function middleware(req, res, next) {
  req.zipline = zipline(req.headers);

  if (req.url !== '/zipline.js') return next();

  res.statusCode = 200;
  res.setHeader('Content-Encoding', 'gzip');
  res.setHeader('Content-Length', line.length);
  res.setHeader('Content-Type', 'text/javascript');

  res.end(line);
}

//
// Expose the module. Expose all the things.
//
zipline.middleware = middleware;
module.exports = zipline;
