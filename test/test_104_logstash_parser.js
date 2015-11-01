var vows = require('vows'),
  assert = require('assert'),
  logstash_config = require('logstash_config');

function check(s, r) {
  return {
    topic: function() {
      return logstash_config.parse(s);
    },
    check: function(result) {
      assert.deepEqual(result, r);
    }
  };
}

vows.describe('Logstash parser config').addBatch({
  'simple': check('input {stdin {}}', {
    input: [{
      stdin: {}
    }]
  }),
  'simple with comment': check('# this is a comment\ninput {stdin {}}', {
    input: [{
      stdin: {}
    }]
  }),
  'simple multi line': check('input {\nstdin      {\n\n}}', {
    input: [{
      stdin: {}
    }]
  }),
  'simple multi line with comment': check('# this is a comment\ninput { #this is a comment\nstdin {}}', {
    input: [{
      stdin: {}
    }]
  }),
  'two lines': check('output {\nelasticsearch {}\nstdout {}\n}', {
    output: [{
      elasticsearch: {}
    }, {
      stdout: {}
    }]
  }),
  'input and output': check('input {stdin {}}\noutput { stdout {}}', {
    input: [{
      stdin: {}
    }],
    output: [{
      stdout: {}
    }]
  }),
  'plugin config id value': check('output {\nelasticsearch { host => localhost }\nstdout { }\n}', {
    output: [{
      elasticsearch: {
        host: 'localhost'
      }
    }, {
      stdout: {}
    }]
  }),
  'plugin config id string': check('output {\nelasticsearch { host => "localhost" }\nstdout { }\n}', {
    output: [{
      elasticsearch: {
        host: 'localhost'
      }
    }, {
      stdout: {}
    }]
  }),
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
  }),
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
  }),
  'plugin config array': check('output {\nelasticsearch { match => [ "timestamp" , "dd/MMM/yyyy:HH:mm:ss Z" ] }\nstdout {}\n}', {
    output: [{
      elasticsearch: {
        match: ['timestamp', 'dd/MMM/yyyy:HH:mm:ss Z' ]
      }
    }, {
      stdout: {}
    }]
  }),
  'plugin multiple params, same line': check('output {\nelasticsearch { host => localhost, port => 354 }\nstdout {}\n}', {
    output: [{
      elasticsearch: {
        host: 'localhost',
        port: 354
      }
    }, {
      stdout: {}
    }]
  }),
  'plugin multiple params, multi lines': check('output {\nelasticsearch { host => localhost\nport => 354 }\nstdout {}\n}', {
    output: [{
      elasticsearch: {
        host: 'localhost',
        port: 354
      }
    }, {
      stdout: {}
    }]
  }),
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
  }),
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
  }),
  'conditional plugin regexp and else': check('filter {\nif [action] =~ "login" {\nmutate { remove => "secret" }}\nelse{ mutate { remove => "secret2"}}\n}', {
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
        }],
        else: [{
          mutate: {
            remove: 'secret2'
          }
        }]
      }
    }]
  }),
  'conditional plugin regexp, else, else if': check('filter {\nif [action] =~ "login" {\nmutate { remove => "secret" }}\nelse if [action] == "logout" { mutate { remove => "secret3"}}\nelse{ mutate { remove => "secret2"}}\n}', {
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
  }),
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
}).export(module);
