function Filter(filter) {
  filter = filter.replace(/\./g, '\\.');
  filter = filter.replace(/\*/g, '.*');
  filter = filter.replace(/\?/g, '.');
  this._filter = new RegExp('^' + filter + '$');
}

Filter.prototype.filter = function(filename) {
  return filename.match(this._filter) ? true : false;
};

exports.create = function(filter) {
  return new Filter(filter);
};
