var vows = require('vows'),
  assert = require('assert'),
  fs = require('fs'),
  querystring = require('querystring'),
  config_mapper = require('lib/config_mapper'),
  logstash_config = require('logstash_config');

function build_cond(x) {
  return querystring.escape(JSON.stringify(x));
}

function check(s, r1, r2) {
  return {
    topic: function() {
      return logstash_config.parse(s);
    },
    check: function(result) {
      assert.deepEqual(result, r1);
      if (r2) {
        assert.deepEqual(config_mapper.map(r1), r2);
      }
    }
  };
}

function check_file(f, r1, r2) {
  return check(fs.readFileSync(f).toString(), r1, r2);
}

vows.describe('Logstash parser config').addBatch({
  'simple': check('input {stdin {}}', {
    input: [{
      stdin: {}
    }]
  }, ['input://stdin://']),
  'simple with comment': check('# this is a comment\ninput {stdin {}}', {
    input: [{
      stdin: {}
    }]
  }, ['input://stdin://']),
  'simple multi line': check('input {\nstdin      {\n\n}}', {
    input: [{
      stdin: {}
    }]
  }, ['input://stdin://']),
  'simple multi line with comment': check('# this is a comment\ninput { #this is a comment\nstdin {}}', {
    input: [{
      stdin: {}
    }]
  }, ['input://stdin://']),
  'two lines': check('output {\nelasticsearch {}\nstdout {}\n}', {
    output: [{
      elasticsearch: {}
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://', 'output://stdout://']),
  'input and output': check('input {stdin {}}\noutput { stdout {}}', {
    input: [{
      stdin: {}
    }],
    output: [{
      stdout: {}
    }]
  }, ['input://stdin://', 'output://stdout://']),
  'plugin config id value': check('output {\nelasticsearch { host => localhost }\nstdout { }\n}', {
    output: [{
      elasticsearch: {
        host: 'localhost'
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?host=localhost', 'output://stdout://']),
  'plugin config id string': check('output {\nelasticsearch { host => "localhost" }\nstdout { }\n}', {
    output: [{
      elasticsearch: {
        host: 'localhost'
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?host=localhost', 'output://stdout://']),
  'plugin config id ip': check('output {\nelasticsearch { host => 127.0.0.1 }\nstdout { }\n}', {
    output: [{
      elasticsearch: {
        host: '127.0.0.1'
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?host=127.0.0.1', 'output://stdout://']),
  'plugin config id dot': check('output {\nelasticsearch { file => output.txt }\nstdout { }\n}', {
    output: [{
      elasticsearch: {
        file: 'output.txt'
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?file=output.txt', 'output://stdout://']),
  'plugin config regex': check('output {\nregex { regex => /localhost/\n fields => [toto, "tata"]}\nstdout { }\n}', {
    output: [{
      regex: {
        regex: 'localhost',
        fields: ['toto', 'tata']
      }
    }, {
      stdout: {}
    }]
  }, ['output://regex://?regex=localhost&fields=toto&fields=tata', 'output://stdout://']),
  'plugin config id string sinle quote': check('output {\nelasticsearch { host => \'localhost\' }\nstdout { }\n}', {
    output: [{
      elasticsearch: {
        host: 'localhost'
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?host=localhost', 'output://stdout://']),
  'plugin config id string with "': check_file('test/parser/special_chars_quotes', {
    output: [{
      elasticsearch: {
        host: '"localhost',
        host2: '\'localhost',
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?host=%22localhost&host2=\'localhost', 'output://stdout://']),
  'plugin config id string with \' single quote': check_file('test/parser/special_chars_quotes_single_quotes', {
    output: [{
      elasticsearch: {
        host: '\'localhost',
        host2 : '"localhost'
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?host=\'localhost&host2=%22localhost', 'output://stdout://']),
  'plugin config id string with \\n': check_file('test/parser/special_chars_new_line', {
    output: [{
      elasticsearch: {
        host: '\nlocalhost'
      }
    }, {
      stdout: {}
    }]
  }),
  'plugin config id string with utf8': check_file('test/parser/special_chars_utf8', {
    output: [{
      elasticsearch: {
        host: 'éàlocalhost'
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?host=%C3%A9%C3%A0localhost', 'output://stdout://']),
  'plugin config id string with space': check_file('test/parser/special_chars_space', {
    output: [{
      elasticsearch: {
        host: 'local host'
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?host=local%20host', 'output://stdout://']),
  'plugin config id string with strange chars': check('output {\nelasticsearch { host => "[]\'!()localhost" }\nstdout { }\n}', {
    output: [{
      elasticsearch: {
        host: '[]\'!()localhost'
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?host=%5B%5D\'!()localhost', 'output://stdout://']),
  'plugin config id string with empty string': check('output {\nelasticsearch { host => "" }\nstdout { }\n}', {
    output: [{
      elasticsearch: {
        host: ''
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?host=', 'output://stdout://']),
  'plugin config id number': check('output {\nelasticsearch { host => 12 }\nstdout { host => 3.4 }\n}', {
    output: [{
      elasticsearch: {
        host: 12
      }
    }, {
      stdout: {
        host: 3.4
      }
    }]
  }, ['output://elasticsearch://?host=12', 'output://stdout://?host=3.4']),
  'plugin config bool': check('output {\nelasticsearch { host => true }\nstdout { host => false}\n}', {
    output: [{
      elasticsearch: {
        host: true
      }
    }, {
      stdout: {
        host: false
      }
    }]
  }, ['output://elasticsearch://?host=true', 'output://stdout://?host=false']),
  'plugin config array': check('output {\nelasticsearch { match => [ "timestamp" , "dd/MMM/yyyy:HH:mm:ss Z" ] }\nstdout {}\n}', {
    output: [{
      elasticsearch: {
        match: ['timestamp', 'dd/MMM/yyyy:HH:mm:ss Z' ]
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?match=timestamp&match=dd%2FMMM%2Fyyyy%3AHH%3Amm%3Ass%20Z', 'output://stdout://']),
  'plugin multiple params, same line': check('output {\nelasticsearch { host => localhost, port => 354 }\nstdout {}\n}', {
    output: [{
      elasticsearch: {
        host: 'localhost',
        port: 354
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?host=localhost&port=354', 'output://stdout://']),
  'plugin multiple params, multi lines': check('output {\nelasticsearch { host => localhost\nport => 354 }\nstdout {}\n}', {
    output: [{
      elasticsearch: {
        host: 'localhost',
        port: 354
      }
    }, {
      stdout: {}
    }]
  }, ['output://elasticsearch://?host=localhost&port=354', 'output://stdout://']),
  'special chars in ids': check('input {\ncompute_field {path => input.txt}\n}', {
    input: [{
      compute_field: {
        path: 'input.txt'
      }
    }]
  }, ['input://compute_field://?path=input.txt']),
  'conditional plugin': check('filter {\nif [action] == "login" {\nmutate { remove => "secret" }\n}\n}', {
    filter: [{
      __if__: {
        ifs: [{
          cond: {
            op: '==',
            left: {field: 'action'},
            right: {value: 'login'}
          },
          then: [{
            mutate: {
              remove: 'secret'
            }
          }]
        }]
      }
    }]
  }, ['filter://mutate://?remove=secret&__dynamic_eval__=' + build_cond({
    false_clauses: [],
    true_clause: {
      op: '==',
      left: {field: 'action'},
      right: {value: 'login'}
    }
  })]),
  'conditional plugin multiple conditions, two plugins in then': check('filter {\nif [action] == "login" and 23 != [action] {\nmutate { remove => "secret" }\nmutate { remove => "secret2" }}\n}', {
    filter: [{
      __if__: {
        ifs: [{
          cond: {
            op: 'and',
            left: {
              op: '==',
              left: {field: 'action'},
              right: {value: 'login'}
            },
            right: {
              op: '!=',
              left:{value: 23},
              right:{field: 'action'}
            }
          },
          then: [{
            mutate: {
              remove: 'secret'
            }
          }, {
            mutate: {
              remove: 'secret2'
            }
          }]
        }]
      }
    }]
  }, ['filter://mutate://?remove=secret&__dynamic_eval__=' + build_cond({
    false_clauses: [],
    true_clause: {
      op: 'and',
      left: {
        op: '==',
        left: {field: 'action'},
        right: {value: 'login'}
      },
      right: {
        op: '!=',
        left:{value: 23},
        right:{field: 'action'}
      }
    }
  }), 'filter://mutate://?remove=secret2&__dynamic_eval__=' + build_cond({
    false_clauses: [],
    true_clause: {
      op: 'and',
      left: {
        op: '==',
        left: {field: 'action'},
        right: {value: 'login'}
      },
      right: {
        op: '!=',
        left:{value: 23},
        right:{field: 'action'}
      }
    }
  })]),
  'conditional plugin regexp and else': check('filter {\nif [action] =~ /\\/\\dlogin/ {\nmutate { remove => "secret" }}\nelse{ mutate { remove => "secret2"}}\n}', {
    filter: [{
      __if__: {
        ifs: [{
          cond: {
            op: '=~',
            left: {field: 'action'},
            right: {value: '/\\dlogin'}
          },
          then: [{
            mutate: {
              remove: 'secret'
            }
          }]
        }],
        else: [{
          mutate: {
            remove: 'secret2'
          }
        }]
      }
    }]
  }),
  'conditional plugin regexp, else, else if': check('filter {\nif [action] =~ /login/ {\nmutate { remove => "secret" }}\nelse if [action] == "logout" { mutate { remove => "secret3"}}\nelse{ mutate { remove => "secret2"}}\n}', {
    filter: [{
      __if__: {
        ifs: [{
          cond: {
            op: '=~',
            left: {field: 'action'},
            right: {value: 'login'}
          },
          then: [{
            mutate: {
              remove: 'secret'
            }
          }]
        }, {
          cond: {
            op: '==',
            left: {field: 'action'},
            right: {value: 'logout'}
          },
          then: [{
            mutate: {
              remove: 'secret3'
            }
          }]
        }],
        else: [{
          mutate: {
            remove: 'secret2'
          }
        }]
      }
    }]
  }, ['filter://mutate://?remove=secret&__dynamic_eval__=' + build_cond({
    false_clauses: [],
    true_clause: {
      op: '=~',
      left: {field: 'action'},
      right: {value: 'login'}
    }
  }), 'filter://mutate://?remove=secret3&__dynamic_eval__=' + build_cond({
    false_clauses: [{
      op: '=~',
      left: {field: 'action'},
      right: {value: 'login'}
    }],
    true_clause: {
      op: '==',
      left: {field: 'action'},
      right: {value: 'logout'}
    }
  }), 'filter://mutate://?remove=secret2&__dynamic_eval__=' + build_cond({
    false_clauses: [{
      op: '=~',
      left: {field: 'action'},
      right: {value: 'login'}
    }, {
      op: '==',
      left: {field: 'action'},
      right: {value: 'logout'}
    }],
  })]),
  'conditional plugin not in': check('filter {\nif [action] not in ["login", "logout", "reset"] {\nmutate { remove => "secret" }\n}\n}', {
    filter: [{
      __if__: {
        ifs: [{
          cond: {
            op: 'not in',
            left: {field: 'action'},
            right: {value: ['login', 'logout', 'reset']}
          },
          then: [{
            mutate: {
              remove: 'secret'
            }
          }]
        }]
      }
    }]
  }),
  'conditional plugin with parenthesis': check('filter {\nif ([action] == "login") {\nmutate { remove => "secret" }\n}\n}', {
    filter: [{
      __if__: {
        ifs: [{
          cond: {
            op: '==',
            left: {field: 'action'},
            right: {value: 'login'}
          },
          then: [{
            mutate: {
              remove: 'secret'
            }
          }]
        }]
      }
    }]
  }),
  'conditional plugin not with parenthesis': check('filter {\nif ! [action] in ["login"] {\nmutate { remove => "secret" }\n}\n}', {
    filter: [{
      __if__: {
        ifs: [{
          cond: {
            op: '!',
            left: {
              op: 'in',
              left: {field: 'action'},
              right: {value: ['login']}
            }
          },
          then: [{
            mutate: {
              remove: 'secret'
            }
          }]
        }]
      }
    }]
  }),
  'big condition': check('filter {\nif ! [action] in ["login"] or ("a" == "b" xor ("c" == "d" or [action] == "login")) {\nmutate { remove => "secret" }\n}\n}', {
    filter: [{
      __if__: {
        ifs: [{
          cond: {
            op: 'or',
            left: {
              op: '!',
              left: {
                op: 'in',
                left: {field: 'action'},
                right: {value: ['login']},
              }
            },
            right: {
              op: 'xor',
              left: {
                op: '==',
                left: { value: 'a' },
                right: { value: 'b' },
              },
              right: {
                op: 'or',
                left: {
                  op: '==',
                  left: { value: 'c' },
                  right: { value: 'd' },
                },
                right: {
                  op: '==',
                  left: { field: 'action' },
                  right: { value: 'login' },
                }
              }
            }
          },
          then: [{
            mutate: {
              remove: 'secret'
            }
          }]
        }]
      }
    }]
  }),
  'hash': check('filter {grok { match => {\'message\' => \'toto\'}}}', {
    filter: [{
      grok: {
        match: {
          'message': 'toto'
        }
      }
    }]
  }),
  'fields and tags 1': check('input { stdin { tags => ["b", "c"]\nadd_fields => {\nz => toto}}}', {
    input: [{
      stdin: {
        tags: ['b', 'c'],
        add_fields: {
          'z': 'toto'
        }
      }
    }]
  }),
  'fields and tags 2': check('input { stdin { tags => ["b", "c"]\nadd_fields => {\nz => toto, z2 => "toto2"}}}', {
    input: [{
      stdin: {
        tags: ['b', 'c'],
        add_fields: {
          'z': 'toto',
          'z2': 'toto2',
        }
      }
    }]
  }),
  'multi if': check('filter { if "GROKED" not in [tags] { drop{} } \n if "GROKED2" not in [tags] { drop{} } }', {
    filter: [{
      __if__: {
        ifs: [{
          cond: {
            op: 'not in',
            left: { value: 'GROKED' },
            right: { field: 'tags' }
          },
          then: [{
            drop: {}
          }]
        }]
      }
    },
    {
      __if__: {
        ifs: [{
          cond: {
            op: 'not in',
            left: { value: 'GROKED2' },
            right: { field: 'tags' }
          },
          then: [{
            drop: {}
          }]
        }]
      }
    }]
  }, [
    'filter://drop://?__dynamic_eval__=%7B%22false_clauses%22%3A%5B%5D%2C%22true_clause%22%3A%7B%22op%22%3A%22not%20in%22%2C%22left%22%3A%7B%22value%22%3A%22GROKED%22%7D%2C%22right%22%3A%7B%22field%22%3A%22tags%22%7D%7D%7D',
    'filter://drop://?__dynamic_eval__=%7B%22false_clauses%22%3A%5B%5D%2C%22true_clause%22%3A%7B%22op%22%3A%22not%20in%22%2C%22left%22%3A%7B%22value%22%3A%22GROKED2%22%7D%2C%22right%22%3A%7B%22field%22%3A%22tags%22%7D%7D%7D',
  ]),
}).export(module);
