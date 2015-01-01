describe('zipline', function () {
  'use strict';

  var assume = require('assume')
    , zipline = require('./');

  it('is exposed as function', function () {
    assume(zipline).to.be.a('function');
  });

  describe('.middleware', function () {
    it('exposes the middleware as function property', function () {
      assume(zipline.middleware).to.be.a('function');
    });
  });
});
