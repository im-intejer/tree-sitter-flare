const PREC = {
  access: 8,
  call: 7,
  mul: 6,
  add: 5,
  compare: 4,
  pipe: 3,
  intersect: 2,
  join: 1,
};

export default grammar({
  name: 'flare',

  extras: $ => [
    $.line_join,
    /\s/,
    $.comment,
  ],

  reserved: {
    global: _ => [
    ],
  },
  word: $ => $.identifier,

  supertypes: $ => [
  ],

  
  rules: {
    source_file: $ => flareSep(choice(
      field('assignment', $.assignment),
    )),

    line_join: _ => token(seq('\\', choice(seq(optional('\r'), '\n'), '\0'))),

    comment: _ => /#[^\n]*/,

    _expression: $ => choice(
      $.call_expression,
      $.binary_expression,
      $.fn,
      $._atom,
    ),

    _atom: $ => choice(
      $.number,
      $.string,
      $.tag,
      $.parenthesized_expression,
      $.braced_arms,
      $.row_cons,
      $.identifier,
      $.question_var,
    ),

    number: $ => token(
      seq(
        optional('-'),
        choice(
          // Hexadecimal: 0x1A2F, 0Xff
          /0[xX][0-9a-fA-F]+/,

          // Binary: 0b1010
          /0[bB][01]+/,

          // Octal: 0o755
          /0[oO][0-7]+/,

          // Decimals & Floats with Scientific Notation
          seq(
            /\d+/,
            optional(seq('.', /\d+/)),
            // optional(seq('.', optional(/\d+/))),
            optional(seq(/[eE]/, optional(/[-+]/), /\d+/))
          ),

          // Fractional floats: .5, .5e-3
          // seq(
          //   '.',
          //   /\d+/,
          //   optional(seq(/[eE]/, optional(/[-+]/), /\d+/))
          // )
        ))
    ),

    string: _ => seq('"', repeat(choice(/[^"\\]/, /\\./)), '"'),

    identifier: _ => new RustRegex('(?i)[a-z_][a-z0-9_]*'),

    tag: $ => seq('$', field('name', $.identifier)),

    question_var: $ => seq('?', field('name', $.identifier)),

    row_cons: $ => seq(
      '(',
      flareSep(choice(
        field('assignment', $.assignment),
        field('rest','..'),
      )),
      ')'
    ),

    assignment: $ => seq(
      field('name', $.identifier),
      '=',
      field('expr', $._expression)
    ),

    binary_expression: $ => choice(
      ...[
        ['.', PREC.access],
        ['*', PREC.mul],
        ['/', PREC.mul],
        ['+', PREC.add],
        ['-', PREC.add],
        ['==', PREC.compare],
        ['!=', PREC.compare],
        ['<', PREC.compare],
        ['<=', PREC.compare],
        ['>', PREC.compare],
        ['>=', PREC.compare],
        ['|>', PREC.pipe],
        ['&', PREC.intersect],
        ['|', PREC.join],
      ].map(([op, the_prec]) =>
        prec.left(the_prec, seq(
          field('left', $._expression),
          field('op', op),
          field('right', $._expression)
        ))
      )
    ),

    fn: $ => seq(
      $._atom,
      ':',
      $._expression,      
    ),

    braced_arms: $ => seq(
      '{',
      flareSep(
        field('arm', $.fn)
      ),
      '}',
    ),

    call_expression: $ => prec.left(PREC.call, seq(
      field('func', $._expression),
      field('expr', $._atom)
    )),

    parenthesized_expression: $ => seq(
      '(',
      $._expression,
      ')'
    ),
 

  }
});

function flare_delim() {
  return choice(',', '\n')
}

function flareSep(rule) {
  return sep_by(rule, flare_delim());
}

function sep_by(rule, separator) {
  return optional(seq(
    rule,
    repeat(seq(separator, rule)),
    optional(separator)
  ));
}

function forward_sep_by(rule, separator) {
  return repeat1(seq(separator, rule));
}
