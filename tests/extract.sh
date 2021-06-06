#!/usr/bin/env bash
PYTHONPATH=.. PYBABEL_ACORN_TOKENIZER=../tokenize.js \
pybabel extract -c: -F fixtures/i18n/messages.ini fixtures -o messages.pot
