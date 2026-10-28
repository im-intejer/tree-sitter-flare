; highlights.scm - Tree-sitter syntax highlighting queries

; No keywords or primitive types

; Operators
[
  "."
  "*"
  "/"
  "+"
  "-"
  ">"
  "<"
  ">="
  "<="
  "=="
  "!="
  "|>"
  "&"
  "|"
] @operator

; Brackets
[
  "("
  ")"
  "{"
  "}"
] @punctuation.bracket

; Delimiters
"," @punctuation.delimiter

; Function literals
":" @punctuation.special

; Literals
(number) @number
(string) @string
(tag) @tag

; Comments
(comment) @comment

; Function calls
(call_expression
  func: (identifier) @function)
