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
  our gzipped payload for forcefully detecting gzip. Defaults to `/zipline.js`.
- **`name`** Name of the cookie, property and localStorage/sessionStorage on
  which we save our gzip information. Defaults to `zipline`.

Now that we know the options we can look at the various of API methods that we
expose.

### zipline.middleware

Return a middleware layer which automatically parsers the encoding headers using
the `Zipline.accepts` method and serves our forced gzip payload if the request
matches the supplied `pathname` option.

```js
connect.use(zipline.middleware());
```

So please note that you need to `execute` the middleware function in order to
return the configured middleware layer.

### zipline.destroy

Clean up the created zipline instance and release all references.

```js
zipline.destroy();
```

### Zipline.accepts

**Please note that this method is exposed on the constructor, not the instance**

Search and parse the accept-encoding headers. If no `accept-encoding` header is
found it will search for potential obfuscated headers to force `gzip,deflate`
for them according to the [YDN][ydn] article. The method accepts 2 arguments:

1. **req** Which is an incoming HTTP request so we can extract the `headers`,
   `rawHeaders` and potentially the `query` object in search for encoding
   information.
2. **name** The name of the cookie or query param which contains gzip overriding
   information. Defaults to `zipline`.

The method will return an array containing the encoding algorithms that can be
used for the response. If no algorithms are detected we will return an empty
array.

```js
require('http').createServer(function (req, res) {
  var encoding = Zipline.accepts(req);

  console.log(encoding); // ['gzip', 'deflate']
});
```

### Loading the `/zipline.js`

The `/zipline.js` contains a JavaScript payload which will set a `zipline`
cookie as well as add `zipline` keys to the `sessionStorage` and `localStorage`.
There are a couple of ways of loading this. You can check if the `req.zipline`
property (when using the middleware) and check if the array contains somethings.
When it's empty you could trigger the following script on the page and load the
`/zipline.js`:

```js
(function(d){
  var iframe = d.body.appendChild(d.createElement('iframe')),
  doc = iframe.contentWindow.document;

  doc.open().write('<body onload="' +
  'var d = document;d.getElementsByTagName(\'head\')[0].' +
  'appendChild(d.createElement(\'script\')).src' +
  '=\'\/zipline.js\'">');

  doc.close();
})(document);
```

The reason why we load it in an iframe is so errors that might be caused because
the browser doesn't support gzip do not bubble up to the main page. It would
only be triggered in the iframe.

## License

MIT

[ydn]: http://developer.yahoo.com/blogs/ydn/posts/2010/12/pushing-beyond-gzipping
[velocity]: http://velocityconf.com/velocity2010/public/schedule/detail/14334
