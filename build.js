'use strict';

var fs = require('fs')
  , zlib = require('zlib')
  , path = require('path')
  , version = require('./package.json').version.split('.')
  , data = fs.readFileSync(path.join(__dirname, 'line.js'), 'utf-8');

//
// Introduce some variables in to the file.
//
data = data.replace('{zipline:major}', version[0])
           .replace('{zipline:minor}', version[1])
           .replace('{zipline:patch}', version[2])
           .replace('{zipline:key}', 'zipline')
           .replace(/[\r|\n]+/g, '')  // Lazy man's yet super effective
           .replace(/\s{2,}/g, '');   // minification process.

zlib.gzip(new Buffer(data), function gzip(err, buffer) {
  if (err) process.exit(1);

  fs.writeFileSync(path.join(__dirname, 'line.gz'), buffer);
  process.exit(0);
});
