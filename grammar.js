const PREC = {
  access: 10,
  call: 9,
  mul: 8,
  add: 7,
  compare: 6,
  pipe: 5,
  intersect: 4,
  join: 3,
  func_colon: 2,
  definition: 1,
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
      // 'match',
    ],
  },
  word: $ => $.identifier,

  supertypes: $ => [
  ],

  rules: {
    source_file: $ => flareSep(choice(
      field('assignment', $.field_assignment),
    )),

    line_join: _ => token(seq('\\', choice(seq(optional('\r'), '\n'), '\0'))),

    comment: _ => /#[^\n]*/,

    _expression: $ => choice(
      $.binary_expression,
      $._atom,
      $.call_expression,
      // $.match_expression,
    ),

    _atom: $ => choice(
      $.number,
      $.string,
      $.boolean,
      $.parenthesized_expression,
      $.fielded_constructor,
      // $.field_access,
      $.identifier,
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

    boolean: _ => choice('true', 'false'),

    identifier: _ => new RustRegex('(?i)[a-z_][a-z0-9_]*'),

    fielded_constructor: $ => seq(
      '(',
      flareSep(choice(
        field('assignment', $.field_assignment),
      )),
      ')'
    ),

    field_assignment: $ => seq(
      field('is_pub', optional('pub')),
      field('id', $.identifier),
      '=',
      field('expr', $._expression)
    ),


    binary_expression: $ => choice(
      ...[
        ['.', PREC.access],
        // ['', PREC.call],
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
        [':', PREC.func_colon],
      ].map(([op, the_prec]) =>
        prec.left(the_prec, seq(
          field('left', $._expression),
          field('op', op),
          field('right', $._expression)
        ))
      )
    ),

    // match_expression: $ => prec.left(PREC.match,seq(
    //   'match',
    //   field('expr', $._atom),
    //   flareSep(
    //     field('arm', $.binary_expression)
    //   )
    // )),

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

function flareSep(rule) {
  return sep_by(rule, choice(',', '\n'));
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
