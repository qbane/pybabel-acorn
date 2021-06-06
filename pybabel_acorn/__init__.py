import sys
from contextlib import contextmanager
from os import path
import importlib

# https://stackoverflow.com/a/41904558/2281355
@contextmanager
def add_to_path(p):
    import sys
    old_path = sys.path
    old_modules = sys.modules
    sys.modules = old_modules.copy()
    sys.path = sys.path[:]
    sys.path.insert(0, p)
    try:
        yield
    finally:
        sys.path = old_path
        sys.modules = old_modules

def extract_javascript(fileobj, keywords, comment_tags, options):
    # import the original lexer before altering sys.path
    # this way, our mocked tokenizer can still access the original lexer
    # and utilities
    import babel.messages.jslexer

    with add_to_path(path.dirname(__file__)):
        # replace the jslexer
        # first, reload all parent namespace so that it can adapt the new sys.path...
        import babel
        importlib.reload(babel)
        import babel.messages
        importlib.reload(babel.messages)
        # this should load our mocked jslexer
        importlib.reload(babel.messages.jslexer)

        # babel.messages.extract is not changed, so we can use directly
        from babel.messages.extract import extract_javascript
        yield from extract_javascript(fileobj, keywords, comment_tags, options)
