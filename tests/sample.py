import json
from pprint import pprint
from babel.messages.extract import extract_javascript, DEFAULT_KEYWORDS

dotted = ('.' in kw for kw in DEFAULT_KEYWORDS)

with open('./fixtures/src/my.js', 'rb') as f:
  entries = extract_javascript(f, DEFAULT_KEYWORDS, [':'], {})
  pprint([*entries])


from babel.messages.jslexer import tokenize

with open('./fixtures/src/my.js', 'r') as f:
  tokens = tokenize(f.read(), dotted=dotted)
  for tok in tokens:
    print(json.dumps([*tok]))
