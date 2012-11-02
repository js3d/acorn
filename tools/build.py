#!/usr/bin/env python

import os
import sys
import json
import subprocess


def print_usage():
    print 'Usage: build.py FILE\n' \
            '\n' \
            'Builds an acorn project based on the configuration in an ' \
            'acorn_project.json file.'
    exit()


def validate_project(config):
    # TODO (vorporeal): Implement project file validation.
    return True


def generate_compiler_args(dirs, config_json):
    # Define some useful variables for the argument generation.
    script_dir = os.path.dirname(os.path.abspath(__file__)) + '/'
    closure_dir = script_dir + '../libs/closure-library/closure/'
    closure_third_party_dir = script_dir + '../libs/closure-library/third_party/closure/'

    # Pull variables out of acorn_project.json.
    namespace = config_json['main']
    output_file = dirs['project'] + config_json['built-script']

    builder_cmd = ['python2']
    builder_cmd.append(closure_dir + 'bin/build/closurebuilder.py')
    builder_cmd.append('--root=' + closure_dir)
    builder_cmd.append('--root=' + closure_third_party_dir)
    builder_cmd.append('--root=' + dirs['project'])
    builder_cmd.append('--namespace=' + namespace)
    # TODO (vorporeal): Add flags to switch between script and compiled.
    builder_cmd.append('--output_mode=script')
    builder_cmd.append('--compiler_jar=' + dirs['tools'] + 'compiler.jar')
    # TODO (vorporeal): Add flags to enable/disable optimization.
    #builder_cmd.append('--compiler_flags=--compilation_level=ADVANCED_OPTIMIZATIONS')
    builder_cmd.append('--output_file=' + output_file)

    return builder_cmd


def main():
    if len(sys.argv) != 2:
        print_usage()

    dirs = dict()
    dirs['tools'] = os.path.dirname(os.path.abspath(__file__)) + '/'
    dirs['project'] = ''
    config_path = os.path.abspath(sys.argv[1]) + '/'
    if config_path.endswith('acorn_project.json'):
        dirs['project'] = os.path.dirname(config_path)
    else:
        dirs['project'] = config_path
        if not config_path.endswith('/'):
            config_path += '/'
        config_path += 'acorn_project.json'
    if not dirs['project'].endswith('/'):
        dirs['project'] += '/'

    # Open the project file.
    try:
        acorn_proj = open(config_path, 'r')
    except IOError:
        print 'ERROR: Could not load project file!'
        print_usage()

    # Parse the JSON contained within the project file.
    try:
        config_json = json.load(acorn_proj)
    except TypeError:
        print 'ERROR: Could not parse project file!'
        exit()

    # Ensure required properties are present.
    if not validate_project(config_json):
        print 'ERROR: Invalid project file!'
        exit()

    # Generate argument array for subprocess.call().
    builder_cmd = generate_compiler_args(dirs, config_json)

    # Run the Closure compiler.
    subprocess.call(builder_cmd)

if __name__ == '__main__':
    main()
