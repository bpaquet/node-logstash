var vows = require('vows'),
    filter_helper = require('./filter_helper');

vows.describe('Message filtering ').addBatch({
  'nothing': filter_helper.create('compute_field', 'titi?value=a', [
    {'message': 'toto'},
  ], [
    {'message': 'toto', 'titi': 'a'},
  ]),
  'only type': filter_helper.create('compute_field', 'titi?value=a&only_type=z', [
    {'message': 'toto'},
    {'message': 'toto', 'type': 'tata'},
    {'message': 'toto', 'type': 'z'},
  ], [
    {'message': 'toto'},
    {'message': 'toto', 'type': 'tata'},
    {'message': 'toto', 'type': 'z', 'titi': 'a'},
  ]),
  'only field exist': filter_helper.create('compute_field', 'titi?value=a&only_field_exist_titi', [
    {'message': 'toto'},
    {'message': 'toto', 'toto': 'b'},
    {'message': 'toto', 'titi': 'b'},
  ], [
    {'message': 'toto'},
    {'message': 'toto', 'toto': 'b'},
    {'message': 'toto', 'titi': 'a'},
  ]),
  'multiple only field exist': filter_helper.create('compute_field', 'titi?value=a&only_field_exist_titi&only_field_exist_toto', [
    {'message': 'toto'},
    {'message': 'toto', 'toto': 'b'},
    {'message': 'toto', 'titi': 'b'},
    {'message': 'toto', 'titi': 'b', 'toto': 'b'},
  ], [
    {'message': 'toto'},
    {'message': 'toto', 'toto': 'b'},
    {'message': 'toto', 'titi': 'b'},
    {'message': 'toto', 'titi': 'a', 'toto': 'b'},
  ]),
  'only field equal': filter_helper.create('compute_field', 'titi?value=a&only_field_equal_titi=z', [
    {'message': 'toto'},
    {'message': 'toto', 'titi': 'b'},
    {'message': 'toto', 'titi': 'z'},
  ], [
    {'message': 'toto'},
    {'message': 'toto', 'titi': 'b'},
    {'message': 'toto', 'titi': 'a'},
  ]),
  'multiple only field equal': filter_helper.create('compute_field', 'titi?value=aa&only_field_equal_titi=a&only_field_equal_toto=b', [
    {'message': 'toto'},
    {'message': 'toto', 'toto': 'b'},
    {'message': 'toto', 'titi': 'a'},
    {'message': 'toto', 'titi': 'a', 'toto': 'b'},
  ], [
    {'message': 'toto'},
    {'message': 'toto', 'toto': 'b'},
    {'message': 'toto', 'titi': 'a'},
    {'message': 'toto', 'titi': 'aa', 'toto': 'b'},
  ]),
}).export(module);
