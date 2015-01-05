# zipline

[![From bigpipe.io][from]](http://bigpipe.io)[![Version npm][version]](http://browsenpm.org/package/zipline)[![Build Status][build]](https://travis-ci.org/bigpipe/zipline)[![Dependencies][david]](https://david-dm.org/bigpipe/zipline)[![Coverage Status][cover]](https://coveralls.io/r/bigpipe/zipline?branch=master)

[from]: https://img.shields.io/badge/from-bigpipe.io-9d8dff.svg?style=flat-square
[version]: http://img.shields.io/npm/v/zipline.svg?style=flat-square
[build]: http://img.shields.io/travis/bigpipe/zipline/master.svg?style=flat-square
[david]: https://img.shields.io/david/bigpipe/zipline.svg?style=flat-square
[cover]: http://img.shields.io/coveralls/bigpipe/zipline/master.svg?style=flat-square

Zipline attempts to discover what content encoding is supported for a given HTTP
request. As [research from Yahoo has shown][ydn] you cannot trust the contents
of the `Accept-Encoding` header and just "roll" with that. In zipline we:

1. Implements the detection algorithm as discussed in Yahoo's article.
2. Detect broken gzip implementations in Internet Explorer 6.
3. Provide a way to forcefully detect gzip as suggested at the
   [velocity][velocity] conference. We store the result in cookie, localStorage
   and sessionStorage.

## Installation

The module is released in the public npm registry and can be installed using

```
npm install --save zipline
```

The `--save` instructs npm to store the dependency in your `package.json` file.

## Usage

In all examples we assume that you've already required an initialized your
Zipline instance as following:

```js
'use strict';

var Zipline = require('zipline')
  , zipline = new Zipline();
```

The constructor accepts one optional argument which is an option object that can
contain the following keys:

- **`pathname`** The pathname on which our middleware should trigger and serve
  our gzipped payload for forcefully detecting gzip.
- **`name`** Name of the cookie, property and localStorage/sessionStorage on
  which we save our gzip information.

Now that we know the options we can look at the various of API methods that we
expose.

### Zipline

The zipline function is directly exposed as function and can required using:

```js
'use strict';

var zipline = require('zipline');
```

The zipline method accepts one argument, which is the headers object you get
from an incoming HTTP request. Zipline will either return `undefined` when it
cannot find any suitable encoding values or a string with the encoding value.
The returned string is either `gzip` or `deflate`.

```js
http.createServer(function (req, res) {
  var encoding = zipline(req.headers) || 'nothing';
  res.end('You accept'+ encoding);
}).listen(8080);
```

### Middleware

The middleware that we expose does 2 things:

1. Automatically parse the incoming request and store the result as `req.zipline`.
2. Respond to `/zipline.js` requests with a forced gzip encoding of a JavaScript
   file which will set a `zipline` cookie on the current domain.

The middleware can be required using:

```js
'use strict';

var middleware = require('zipline').middleware;

//
// Example: Expressjs
//
var express = require('express')
  , app = express();

app.use(middleware);
```

## License

MIT

[ydn]: http://developer.yahoo.com/blogs/ydn/posts/2010/12/pushing-beyond-gzipping
[velocity]: http://velocityconf.com/velocity2010/public/schedule/detail/14334
