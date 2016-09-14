
%{
  function process_string(s) {
    return s.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\'/g, '\'').replace(/\\\//g, '/');
  }
%}

/* lexical grammar */
%lex
%%

\"(\\\"|[^\"])*\"                   yytext = process_string(yytext.substr(1, yyleng - 2)); return 'VALUE'
\'(\\\'|[^\'])*\'                   yytext = process_string(yytext.substr(1, yyleng - 2)); return 'VALUE'
\/(\\\/|[^\/])*\/                   yytext = process_string(yytext.substr(1, yyleng - 2)); return 'VALUE'
\s+                                 /* skip whitespace */
"#".*                               /* ignore comment */
[0-9]+\.[0-9]+[^0-9\.]              yytext = parseFloat(yytext, 10); return 'VALUE'
[0-9]+[^0-9\.]                      yytext = parseInt(yytext, 10); return 'VALUE'
"true"                              yytext = true; return 'VALUE'
"false"                             yytext = false; return 'VALUE'
"{"                                 return 'START'
"}"                                 return 'STOP'
"["                                 return 'ARRAY_START'
"]"                                 return 'ARRAY_STOP'
"("                                 return 'PARENTHESIS_START'
")"                                 return 'PARENTHESIS_STOP'
"=>"                                return 'SET'
","                                 return 'COMA'
"if"                                return 'IF'
"else"                              return 'ELSE'
"=="                                return 'BINARY_OPERATOR'
"!="                                return 'BINARY_OPERATOR'
"<"                                 return 'BINARY_OPERATOR'
">"                                 return 'BINARY_OPERATOR'
"<="                                return 'BINARY_OPERATOR'
">="                                return 'BINARY_OPERATOR'
"=~"                                return 'BINARY_OPERATOR'
"!~"                                return 'BINARY_OPERATOR'
"not in"                            return 'BINARY_OPERATOR'
"in"                                return 'BINARY_OPERATOR'
"!"                                 return 'UNARY_OPERATOR'
"and"                               return 'CONDITION_OPERATOR'
"or"                                return 'CONDITION_OPERATOR'
"nand"                              return 'CONDITION_OPERATOR'
"xor"                               return 'CONDITION_OPERATOR'
[0-9a-zA-Z_\-\./]+                  return 'ID'
<<EOF>>                             return 'EOF'

/lex

%start logstash_config

%% /* language grammar */

logstash_config
  : main_lines EOF
  { return $1; }
  ;

main_lines
  : main_line
  { $$ = {}; $$[$1.key] = $1.value; }
  | main_lines main_line
  { $$ = $1; $$[$2.key] = $2.value; }
  ;

main_line
  : ID START lines STOP
  { $$ = {key: $1, value: $3} }
  ;

lines
  : lines line
  { $$ = $1.concat($2); }
  | line
  { $$ = [$1]; }
  ;

if
  : IF condition START lines STOP
  { $$ = {__if__: {ifs: [{cond: $2, then: $4}]}}; }
  | IF condition START lines STOP ELSE if
  { $$ = $7; $$.__if__.ifs = [{cond: $2, then: $4}].concat($$.__if__.ifs); }
  | IF condition START lines STOP ELSE START lines STOP
  { $$ = {__if__: {ifs: [{cond: $2, then: $4}], else: $8}}; }
  ;

condition
  : condition CONDITION_OPERATOR condition
  { $$ = {op: $2, left: $1, right: $3}; }
  | sub_condition
  { $$ = $1; }
  ;

sub_condition
  : condition_member BINARY_OPERATOR condition_member
  { $$ = {op: $2, left: $1, right: $3}; }
  | PARENTHESIS_START condition PARENTHESIS_STOP
  { $$ = $2; }
  | UNARY_OPERATOR sub_condition
  { $$ = {op: $1, left: $2}; }
  ;

condition_member
  : ARRAY_START ID ARRAY_STOP
  { $$ = {field: $2}; }
  | value
  { $$ = {value: $1}; }
  ;

line
  : ID plugin_params
  { $$ = {}; $$[$1] = $2; }
  | if
  { $$ = $1; }
  ;

plugin_params
  : START STOP
  { $$ = {}; }
  | START params STOP
  { $$ = $2; }
  ;

params
  : params param
  { $$ = $1; $$[$2.key] = $2.value; }
  | params COMA param
  { $$ = $1; $$[$3.key] = $3.value; }
  | param
  { $$ = {}; $$[$1.key] = $1.value; }
  ;

param
  : ID SET value
  { $$ = {key: $1, value: $3}; }
  | value SET value
  { $$ = {key: $1, value: $3}; }
  ;

value
  : VALUE
  { $$ = $1; }
  | ID
  { $$ = $1; }
  | ARRAY_START values ARRAY_STOP
  { $$ = $2; }
  | START params STOP
  { $$ = $2; }
  ;

values_member
  : VALUE
  { $$ = $1; }
  | ID
  { $$ = $1; }
  ;

values
  : values_member
  { $$ = [$1]; }
  | values COMA values_member
  { $$ = $1.concat($3); }
  ;

