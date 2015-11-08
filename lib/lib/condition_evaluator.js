
function get(o, data) {
  if (o.value) {
    return o.value;
  }
  if (o.field) {
    return data[o.field];
  }
  throw new Error('Not implemented get for ' + JSON.stringify(o));
}

function get_string(o, data) {
  var x = get(o, data);
  if (typeof x !== 'string') {
    throw new Error('Need a string, got ' + typeof x);
  }
  return x;
}

function force_string(x) {
  if (typeof x !== 'string') {
    x = x === undefined ? '' : x.toString();
  }
  return x;
}

function force_number(x) {
  if (typeof x !== 'number') {
    var z = parseFloat(x, 10);
    if (isNaN(z)) {
      throw new Error('Unable to cast to int : ' + x);
    }
    else {
      x = z;
    }
  }
  return x;
}

var compute = exports.compute = function(cond, data, op_override) {
  var op = op_override || cond.op;
  if (op === '==') {
    return force_string(get(cond.left, data)) === force_string(get(cond.right, data));
  }
  else if (op === '!=') {
    return ! compute(cond, data, '==');
  }
  else if (op === '=~') {
    return force_string(get(cond.left, data)).match(new RegExp(get_string(cond.right, data))) !== null;
  }
  else if (op === '!~') {
    return ! compute(cond, data, '=~');
  }
  else if (op === 'in') {
    var r1 = get(cond.right, data);
    var l1 = force_string(get(cond.left, data));
    if (Array.isArray(r1)) {
      for(var i = 0; i < r1.length; i ++) {
        if (force_string(r1[i]) === l1) {
          return true;
        }
      }
      return false;
    }
    else {
      throw new Error('In / not in right args must be an array : ' + JSON.stringify(r1));
    }
  }
  else if (op === 'not in') {
    return ! compute(cond, data, 'in');
  }
  else if (op === '>') {
    var l2 = force_number(get(cond.left, data));
    var r2 = force_number(get(cond.right, data));
    return l2 > r2;
  }
  else if (op === '<=') {
    return ! compute(cond, data, '>');
  }
  else if (op === '>=') {
    var l3 = force_number(get(cond.left, data));
    var r3 = force_number(get(cond.right, data));
    return l3 >= r3;
  }
  else if (op === '<') {
    return ! compute(cond, data, '>=');
  }
  else {
    throw new Error('Not implemented op ' + cond.op);
  }
};