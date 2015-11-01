
/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
"#".*                 /* ignore comment */
\"[^\"]*\"            yytext = yytext.substr(1,yyleng-2); return 'VALUE'
[0-9]+\.[0-9]+        yytext = parseFloat(yytext, 10); return 'VALUE'
[0-9]+                yytext = parseInt(yytext, 10); return 'VALUE'
"true"                yytext = true; return 'VALUE'
"false"               yytext = false; return 'VALUE'
"{"                   return 'START'
"}"                   return 'STOP'
"["                   return 'ARRAY_START'
"]"                   return 'ARRAY_STOP'
"=>"                  return 'SET'
[0-9a-zA-Z]+          return 'ID'
","                   return 'COMA'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

%start logstash_config

%% /* language grammar */

logstash_config
  : main_lines EOF
  { return $1; }
  ;

main_lines
  : main_line
  { $$ = $1 }
  | main_lines main_line
  { $$ = $1; k = Object.keys($2); $$[k] = $2[k] }
  ;

main_line
  : ID START lines STOP
  { $$ = {}; $$[$1] = $3}
  ;

lines
  : lines line
  { $$ = $1.concat($2) }
  | line
  { $$ = [$1] }
  ;

line
  : ID plugin_params
  { $$ = {}; $$[$1] = $2}
  ;

plugin_params
  : START STOP
  { $$ = {} }
  | START params STOP
  { $$ = $2 }
  ;

params
  : params param
  { $$ = $1; k = Object.keys($2); $$[k] = $2[k] }
  | params COMA param
  { $$ = $1; k = Object.keys($3); $$[k] = $3[k] }
  | param
  { $$ = $1 }
  ;

param
  : ID SET value
  { $$ = {}; $$[$1] = $3}
  ;

value
  : VALUE
  { $$ = $1 }
  | ID
  { $$ = $1 }
  | ARRAY_START values ARRAY_STOP
  { $$ = $2 }
  ;

values
  : VALUE
  { $$ = [$1] }
  | values COMA VALUE
  { $$ = $1.concat($3) }
  ;

