const acorn = require('acorn')

function drainInput() {
  return new Promise((resolve, reject) => {
    let emitted = false
    const emit = f => {
      return arg => {
        if (emitted) return
        emitted = true
        f(arg)
      }
    }

    const chunks = []
    process.stdin.on('data', chunk => chunks.push(chunk))
    process.stdin.on('end', emit(() => resolve(chunks.join(''))))
    process.stdin.on('error', emit(reject))
  })
}

function serialize([a, b, c]) {
  return `[${JSON.stringify(a)}, ${JSON.stringify(b)}, ${JSON.stringify(c)}]`
}

const BlockComment = new acorn.TokenType('blockComment')
const LineComment = new acorn.TokenType('lineComment')

// if 2nd argument is true, the token content will be yielded from slicing from source instead
const typeDescriptorMap = Object.assign(Object.create(null), {
  lineComment: ['linecomment', true],
  blockComment: ['multilinecomment', true],
  name: ['name', true],
  num: ['number'],
  template: ['template_string'],
  regexp: ['regexp', true],
  string: ['string', true],
  '${': ['operator'],
})

Object.values(acorn.tokTypes).filter(tt => {
  if ([...'()[]{}.,;:'].includes(tt.label)) {
    return true
  }
  if (tt.binop != null || tt.isAssign || tt.prefix || tt.postfix) {
    return true
  }
  return false
}).forEach(tt => {
  typeDescriptorMap[tt.label] = ['operator']
})

function parse(code) {
  const tokens = []
  acorn.parse(code, {
    ecmaVersion: 2018,
    locations: true,
    onToken: tokens,
    onComment(block, text, start, end, locStart, locEnd) {
      const comment = {
        type: block ? BlockComment : LineComment,
        value: text,
        start: start,
        end: end,
        loc: new acorn.SourceLocation(this, locStart, locEnd),
      }
      tokens.push(comment)
    },
  })
  return tokens
}

;(async () => {
  const code = await drainInput()
  const handleDottedName = true

  let tokens
  try {
    tokens = parse(code)
  } catch (e) {
    if (e.raisedAt) {
      throw new TypeError(`Failed to parse the source: ${e.message}`)
    }
  }

  let dottedState = null
  for (const tok of tokens) {
    const lineno = tok.loc.start.line
    const typeLabel = tok.type.label
    const typeDesc = typeDescriptorMap[typeLabel]

    if (handleDottedName) {
      if (dottedState != null) {
        if (dottedState.expectDot && typeLabel == '.') {
          dottedState.expectDot = false
          continue
        } else if (!dottedState.expectDot && typeLabel == 'name') {
          dottedState.fragments.push(tok.value)
          dottedState.expectDot = true
          continue
        } else {
          console.log(serialize([
            dottedState.fragments.length > 1 ? 'dotted_name' : 'name',
            dottedState.fragments.join('.'),
            dottedState.lineno
          ]))
          dottedState = null
        }
      } else {
        if (tok.type.label == 'name') {
          dottedState = { fragments: [tok.value], expectDot: true, lineno }
          continue
        }
      }
    }

    if (typeDesc != null) {
      const [type, fromSource] = typeDesc
      let value
      if (typeLabel == 'template') {
        value = '`' + tok.value + '`'
      } else {
        value = fromSource ?
                code.slice(tok.start, tok.end) :
                (tok.value != null ? tok.value : tok.type.label)
      }
      console.log(serialize([type, value, lineno]))
    }
  }

  if (dottedState != null) {
    throw new Error('There is unemitted dotted name')
  }
})().catch(err => {
  console.error(err)
  process.exit(1)
})
