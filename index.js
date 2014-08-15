'use strict';
var merge = require('merge');
var qs = require('querystring');
var crypto = require('crypto');
var request = require('request');
var xml = require('xml2js');
var debug = require('debug')('dimoco');

function ctor(pwd, url, options) {
  debug('initializing');
  if (typeof url === 'object') {
    options = url;
    url = null;
  }
  this.pwd = pwd;
  this.url = url || 'http://services.dimoco.at/smart/payment';
  this.options = merge({}, module.exports.defaults, options);
}

module.exports = ctor;

module.exports.defaults = {};

ctor.prototype.action = function action(actionName, props, cb) {
  debug('doing action: %s', actionName);
  var self = this;
  var form = this.form(merge({
    action: actionName
  }, props));

  debug('making request to %s with %j', this.url, form);
  this.makeRequest({
    url: this.url,
    qs: form
  }, function(err, body) {
    if (err) {
      return cb(err);
    }
    self.parse(body, function(err, obj) {
      if (err) {
        return cb(err);
      }

      cb(null, obj);
    });
  });
};

ctor.prototype.makeRequest = function makeRequest(options, cb) {
  request(options, function(err, response, body) {
    cb(err, body);
  });
};

ctor.prototype.form = function form(opts) {
  debug('converting to url: %j', opts);
  var options = merge({}, this.options, opts);
  options.digest = this.digest(options);
  return options;
};

ctor.prototype.digest = function digest(options) {
  debug('digesting %j', options);
  var hash = crypto.createHmac('sha256', this.pwd);
  var str;

  if (typeof options === 'string' ) {
    str = options;
  } else {
    str = Object.keys(options)
      .sort()
      .reduce(function(str, key) {
        return str + options[key];
      }, '');
  }

  hash.update(str);
  return hash.digest('hex');
};

ctor.prototype.validate = function validate(options, checksum) {
  debug('validating %j againt %s', options, checksum);
  var hex = this.digest(options);
  return hex === checksum;
};

ctor.prototype.parse = function parse(rawXml, cb) {
  debug('parse xml');
  this._parse(rawXml, function(err, obj) {
    if (err) {
      return cb(err);
    }
    debug('_parse result is %j', obj);
    if (!obj) {
      return cb();
    }

    cb(null, obj.result);
  });
};

ctor.prototype._parse = function _parse(rawXml, cb) {
  debug('_parse raw xml');
  xml.parseString(rawXml, {explicitArray: false}, cb);
};
