#!/usr/bin/env python

import os.path as path
import subprocess
import sys

UP = '../'
TOOLS_DIR = path.dirname(path.abspath(__file__))
ACORN_DIR = path.abspath(path.join(TOOLS_DIR, UP))
CLOSURE_DIR = path.join(ACORN_DIR, 'libs/closure-library/closure')
CLOSURE_BASEJS_DIR = path.join(CLOSURE_DIR, 'goog')
SRC_DIR = path.join(ACORN_DIR, 'src')

DEPSWRITER_PATH = path.join(CLOSURE_DIR, 'bin/build/depswriter.py')
OUTPUT_FILE = path.join(SRC_DIR, 'deps.js')

root_with_prefix = ' '.join([SRC_DIR,
    path.relpath(SRC_DIR, CLOSURE_BASEJS_DIR)])

cmd = [sys.executable]
cmd.append(path.relpath(DEPSWRITER_PATH))
cmd.append('--root_with_prefix=' + root_with_prefix)
cmd.append('--output_file=' + OUTPUT_FILE)

subprocess.call(cmd)
