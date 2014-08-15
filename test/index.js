'use strict';

var test = require('tap').test;
var Dimoco = require('..');
var readFileSync = require('fs').readFileSync;
var nock = require('nock');

test('ctor arity 3', function(t) {
  var d = new Dimoco('pwd', 'url', {foo: 'bar'});
  t.equal(d.pwd, 'pwd', 'pwd should equal `pwd`');
  t.equal(d.url, 'url', 'url should equal the url user set');
  t.deepEqual(d.options, {
    foo: 'bar'
  }, 'options should equal the object which was passed');
  t.end();
});

test('ctor arity 2', function(t) {
  var d = new Dimoco('pwd', {
    foo: 'bar'
  });
  t.equal(d.pwd, 'pwd', 'pwd should equal `pwd`');
  t.equal(d.url, 'http://services.dimoco.at/smart/payment', 'default url should be dimoco production url');
  t.deepEqual(d.options, {
    foo: 'bar'
  });
  t.end();
});

test('_parse method', function(t) {
  var d = new Dimoco('pwd');
  var content = readFileSync('./fixtures/identify.xml', 'utf8');
  d._parse(content, function(err, obj) {
    t.equal(err, null, 'error should not exist');
    t.equal(obj.result.action, 'identify', 'result.action should be identify');
    t.equal(obj.result.request_id, 'such-request-id', 'result.request_id should be `such-request-id`');
    t.end();
  });
});

test('parse method', function(t) {
  var d = new Dimoco('pwd');
  var content = readFileSync('./fixtures/identify.xml', 'utf8');
  d.parse(content, function(err, obj) {
    t.equal(err, null, 'error should not exist');
    t.equal(obj.action, 'identify', 'parse should return obj.result instead of obj');
    t.equal(obj.request_id, 'such-request-id', 'obj.request_id should be `such-request-id`');
    t.end();
  });
});

test('digest method', function(t) {
  var d = new Dimoco('pwd');

  var digest = d.digest({
    order: '11',
    channel: 'wap'
  });
  t.equal(digest, '242e508b7f472dd828ffa84b84b3ccd924b5f4d4d25157ac46cc3f736069a769', 'digest should eql');
  t.end();
});

test('digest method with string', function(t) {
  var d = new Dimoco('pwd');
  var txt = readFileSync(__dirname + '/fixtures/identify.xml').toString();
  var digest = d.digest(txt);
  t.equal(digest, '6a66d501c2a15f1deff9fe2ac9ee9585f502eca5b6c918a2c09b6e65d9c22ca4', 'digest should eql');
  t.end();
});

test('action method', function(t) {
  var d = new Dimoco('pwd', 'http://example.org');
  nock('http://example.org')
    .get('/?action=identify&digest=57934c2acbeb7b5f3603948331c8ca1a34e6d58f095ebbd6a38aca0c757fb378')
    .once()
    .replyWithFile(200, __dirname + '/fixtures/identify.xml');

  d.action('identify', {}, function(err, result) {
    t.equal(err, null, 'err should be null');
    t.equal(result.action, 'identify', 'action is identify');

    t.end();
  });
});