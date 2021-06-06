import os
import json
import subprocess
from babel.messages.jslexer import Token

def tokenize(source, jsx=True, dotted=True, template_string=True):
    # TODO: disable jsx support by default
    # TODO: read those argument and pass them to JS

    path_to_tokenizer = os.environ.get('PYBABEL_ACORN_TOKENIZER', 'tokenize.js')

    p = subprocess.run(
        ['node', path_to_tokenizer],
        input=source,
        universal_newlines=True,
        stderr=subprocess.PIPE,
        stdout=subprocess.PIPE,
    )
    result = p.stdout

    if p.returncode != 0:
        raise Exception(f'External tokenizer failed with "{p.stderr}"')

    for ln in result.split('\n'):
        if not ln.strip():
            break

        t = json.loads(ln)
        yield Token(*t)
