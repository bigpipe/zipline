'use strict';

var fs = require('fs')
  , zlib = require('zlib')
  , major = require('./package.json').version.split('.').shift()
  , data = 'document.cookie="zipline='+ major +'; expires=Thu, 18 Dec 2913 12:00:00 UTC";';

zlib.gzip(new Buffer(data), function gzip(err, buffer) {
  if (err) process.exit(1);

  fs.writeFileSync(__dirname +'/line.gz', buffer);
  process.exit(0);
});
