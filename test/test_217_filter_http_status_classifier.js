var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter http status classifier').addBatch({
  'normal': filter_helper.create('http_status_classifier', 'http_status', [
    {
      http_status: 302,
    },
  ], [
    {
      http_status: 302,
      http_class: '3xx',
    },
  ]),
  'all': filter_helper.create('http_status_classifier', 'http_status', [
    {
      message: 'toto'
    },
    {
      message: 'toto',
      http_status: 99,
    },
    {
      message: 'toto',
      http_status: 100,
    },
    {
      message: 'toto',
      http_status: 200,
    },
    {
      message: 'toto',
      http_status: 299,
    },
    {
      message: 'toto',
      http_status: 302,
    },
    {
      message: 'toto',
      http_status: 404,
    },
    {
      message: 'toto',
      http_status: 499,
    },
    {
      message: 'toto',
      http_status: 500,
    },
    {
      message: 'toto',
      http_status: 504,
    },
    {
      message: 'toto',
      http_status: 612,
    },
  ], [
    {
      message: 'toto'
    },
    {
      message: 'toto',
      http_status: 99,
    },
    {
      message: 'toto',
      http_status: 100,
      http_class: '1xx',
    },
    {
      message: 'toto',
      http_status: 200,
      http_class: '2xx',
    },
    {
      message: 'toto',
      http_status: 299,
      http_class: '2xx',
    },
    {
      message: 'toto',
      http_status: 302,
      http_class: '3xx',
    },
    {
      message: 'toto',
      http_status: 404,
      http_class: '4xx',
    },
    {
      message: 'toto',
      http_status: 499,
      http_class: '4xx',
    },
    {
      message: 'toto',
      http_status: 500,
      http_class: '5xx',
    },
    {
      message: 'toto',
      http_status: 504,
      http_class: '5xx',
    },
    {
      message: 'toto',
      http_status: 612,
    },
  ]),
  'special code': filter_helper.create('http_status_classifier', 'http_status?special_codes=499,302', [
    {
      http_status: 134,
    },
    {
      http_status: 499,
    },
    {
      http_status: 302,
    },
  ], [
    {
      http_status: 134,
      http_class: '1xx',
    },
    {
      http_status: 499,
      http_class: '499',
    },
    {
      http_status: 302,
      http_class: '302',
    },
  ]),
  'string as http_status': filter_helper.create('http_status_classifier', 'http_status', [
    {
      message: 'toto',
      http_status: 'toto',
    },
    {
      message: 'toto',
      http_status: '102',
    },
  ], [
    {
      message: 'toto',
      http_status: 'toto',
    },
    {
      message: 'toto',
      http_status: '102',
      http_class: '1xx',
    },
  ]),
}).export(module);
