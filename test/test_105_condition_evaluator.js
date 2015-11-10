var vows = require('vows'),
  assert = require('assert'),
  condition_evaluator = require('lib/condition_evaluator');

function check(op, data, result) {
  return {
    topic: function() {
      return condition_evaluator.compute(op, data);
    },
    check: function(x) {
      assert.equal(x, result);
    }
  };
}

function check_error(op, data, result) {
  return {
    topic: function() {
      try {
        condition_evaluator.compute(op, data);
      }
      catch(e) {
        return e;
      }
      return undefined;
    },
    check: function(err) {
      assert.isDefined(err);
      assert.match(err.toString(), result);
    }
  };
}

var op1 = {
  op: '==',
  left: {
    value: 'aa',
  },
  right: {
    value: 'bb'
  }
};

var op2 = {
  op: '==',
  left: {
    field: 'type',
  },
  right: {
    value: 'bb'
  }
};

var op3 = {
  op: '=~',
  left: {
    field: 'type',
  },
  right: {
    value: '^a.c'
  }
};

var op4 = {
  op: '!~',
  left: {
    field: 'type',
  },
  right: {
    value: '567'
  }
};

var op5 = {
  op: '!=',
  left: {
    field: 'type',
  },
  right: {
    value: 567
  }
};

var op6 = {
  op: 'in',
  left: {
    field: 'type',
  },
  right: {
    value: ['a', 'b', 'c', 35]
  }
};

var op7 = {
  op: 'not in',
  left: {
    field: 'type',
  },
  right: {
    field: 'array'
  }
};

var op8 = {
  op: '>',
  left: {
    field: 'type',
  },
  right: {
    field: 'message'
  }
};

var op9 = {
  op: '>=',
  left: {
    field: 'type',
  },
  right: {
    field: 'message'
  }
};

var op10 = {
  op: '<=',
  left: {
    field: 'type',
  },
  right: {
    field: 'message'
  }
};

var op11 = {
  op: '<',
  left: {
    field: 'type',
  },
  right: {
    field: 'message'
  }
};

var op12 = {
  op: '=~',
  left: {
    field: 'type',
  },
  right: {
    value: '12'
  }
};

var op13 = {
  op: '=~',
  left: {
    field: 'type',
  },
  right: {
    value: '/12'
  }
};

var op14 = {
  op: '=~',
  left: {
    field: 'type',
  },
  right: {
    value: '56.'
  }
};

vows.describe('Condition evaluator').addBatch({
  'simple equal': check(op1, {}, false),
  'equal 1': check(op2, {}, false),
  'equal 2': check(op2, {type: 12}, false),
  'equal 3': check(op2, {type: 'bb'}, true),
  'equal 4': check(op2, {type: 'bb2'}, false),
  'regex 1': check(op3, {type: 'abc'}, true),
  'regex 2': check(op3, {type: 'adc'}, true),
  'regex 3': check(op3, {type: 'addc'}, false),
  'regex 4': check(op3, {type: 'totoabc'}, false),
  'regex 5': check(op3, {type: 12}, false),
  'not regex 1': check(op4, {type: 12}, true),
  'not regex 2': check(op4, {type: 567}, false),
  'not regex 3': check(op4, {type: '567'}, false),
  'not equal 1': check(op5, {type: '567'}, false),
  'not equal 2': check(op5, {type: '568'}, true),
  'in 1': check(op6, {type: 568}, false),
  'in 2': check(op6, {type: '568'}, false),
  'in 3': check(op6, {type: 'ab'}, false),
  'in 4': check(op6, {type: 'a'}, true),
  'in 5': check(op6, {type: 'c'}, true),
  'in 6': check(op6, {type: 35}, true),
  'not in 1': check_error(op7, {type: 35}, /right args must be an array/),
  'not in 2': check_error(op7, {type: 35, array: 1244}, /right args must be an array/),
  'not in 3': check(op7, {type: 35, array: [1244, 35]}, false),
  'not in 4': check(op7, {type: 35, array: [1244, 36]}, true),
  'not in 5': check(op7, {type: '35', array: ['1244', '36']}, true),
  'not in 6': check(op7, {type: '36', array: ['1244', '36']}, false),
  '> 1': check(op8, {type: '36', message: '37'}, false),
  '> 2': check(op8, {type: '36', message: '35'}, true),
  '> 3': check(op8, {type: '36', message: 35}, true),
  '> 4': check(op8, {type: '36', message: 35.2}, true),
  '> 5': check(op8, {type: '35.3', message: 35.2}, true),
  '> 6': check(op8, {type: '35.1', message: 35.2}, false),
  '> 7': check_error(op8, {type: 'abc', message: 35.2}, /Unable to cast to int/),
  '> 8': check(op8, {type: '35.2', message: 35.2}, false),
  '>= 1': check(op9, {type: '35.2', message: 35.2}, true),
  '>= 2': check(op9, {type: '35.2', message: 35.3}, false),
  '<= 1': check(op10, {type: '35.2', message: 35.2}, true),
  '<= 2': check(op10, {type: '35.2', message: 35.1}, false),
  '< 1': check(op11, {type: '35.2', message: 35.2}, false),
  '< 2': check(op11, {type: '35.2', message: 35.4}, true),
  '! < 1': check({op: '!', left: op11}, {type: '35.2', message: 35.4}, false),
  '! == 1': check({op: '!', left: op1}, {}, true),
  '! string': check_error({op: '!', left: 'aaa'}, {}, /Not a boolean/),
  '! bool': check({op: '!', left: 'false'}, {}, true),
  'and 1': check({op: 'and', left: 'true', right: true}, {}, true),
  'and 2': check({op: 'and', left: 'true', right: op1}, {}, false),
  'and 3': check({op: 'and', left: 'true', right: {op: '!', left: op1}}, {}, true),
  'or 1': check({op: 'or', left: 'false', right: {op: '!', left: op1}}, {}, true),
  'xor 1': check({op: 'xor', left: 'false', right: {op: '!', left: op1}}, {}, true),
  'xor 2': check({op: 'xor', left: 'true', right: {op: '!', left: op1}}, {}, false),
  'nand 1': check({op: 'nand', left: 'true', right: {op: '!', left: op1}}, {}, false),
  'nand 2': check({op: 'nand', left: 'false', right: {op: '!', left: op1}}, {}, true),
  'regex2 1': check(op12, {type: 12}, true),
  'regex2 2': check(op12, {type: 13}, false),
  'regex2 3': check(op12, {}, false),
  'regex2 4': check(op13, {type: 'aaaa/12'}, true),
  'regex2 5': check(op13, {type: 'aaaa#12'}, false),
  'regex2 6': check(op14, {type: '567'}, true),
  'regex2 7': check(op14, {type: '597'}, false),
}).export(module);
