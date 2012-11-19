#!/usr/bin/env python

import os.path as path
import sys
import json
import subprocess


def print_usage():
  print 'Usage: build.py FILE\n' \
    '\n' \
    'Builds an acorn project based on the configuration in an ' \
        'acorn_project.json file.'
  sys.exit()


def get_core_directories(dirs):
  # Get the path to the tools directory (which contains this script).
  dirs['tools'] = path.dirname(path.abspath(__file__))
  # Get the path to the acorn source directory.
  acorn_path = path.join(path.dirname(path.abspath(__file__)), \
      '../src/acorn')
  dirs['acorn'] = path.abspath(acorn_path)
  # Get the path to the directory of the project we're building.
  config_path = path.abspath(sys.argv[1])
  if config_path.endswith('acorn_project.json'):
    dirs['project'] = path.dirname(config_path)
  else:
    dirs['project'] = config_path


def validate_project(config):
  # TODO (vorporeal): Implement project file validation.
  return True


def generate_compiler_args(dirs, config_json):
  # Define some useful variables for the argument generation.
  build_script_dir = path.dirname(path.abspath(__file__))
  closure_dir = path.join(build_script_dir, '../libs/closure-library/closure/')
  closure_third_party_dir = path.join(build_script_dir, \
      '../libs/closure-library/third_party/closure/')

  # Pull variables out of acorn_project.json.
  namespace = config_json['main']
  output_file = path.join(dirs['project'], config_json['built-script'])

  # Generate the argument array for our subprocess call.
  builder_cmd = [sys.executable]
  builder_cmd.append(path.join(closure_dir, 'bin/build/closurebuilder.py'))
  builder_cmd.append('--root=' + closure_dir)
  builder_cmd.append('--root=' + closure_third_party_dir)
  builder_cmd.append('--root=' + dirs['acorn'])
  builder_cmd.append('--root=' + dirs['project'])
  builder_cmd.append('--namespace=' + namespace)
  # TODO (vorporeal): Add flags to switch between script and compiled.
  builder_cmd.append('--output_mode=script')
  builder_cmd.append('--compiler_jar=' + \
      path.join(dirs['tools'], 'compiler.jar'))
  # TODO (vorporeal): Add flags to enable/disable optimization.
  #builder_cmd.append('--compiler_flags=--compilation_level=ADVANCED_OPTIMIZATIONS')
  builder_cmd.append('--output_file=' + output_file)

  return builder_cmd


def main():
  if len(sys.argv) != 2:
    print_usage()

  dirs = dict()
  get_core_directories(dirs)

  # Open the project file.
  try:
    config_path = path.join(dirs['project'], 'acorn_project.json')
    acorn_proj = open(config_path, 'r')
  except IOError:
    print 'ERROR: Could not load project file!'
    print_usage()

  # Parse the JSON contained within the project file.
  try:
    config_json = json.load(acorn_proj)
  except TypeError:
    sys.exit('ERROR: Could not parse project file!')

  # Ensure required properties are present.
  if not validate_project(config_json):
    sys.exit('ERROR: Invalid project file!')

  # Generate argument array for subprocess.call().
  builder_cmd = generate_compiler_args(dirs, config_json)

  # Run the Closure compiler.
  subprocess.call(builder_cmd)

if __name__ == '__main__':
  if sys.version_info[0] > 2:
    sys.exit('Sorry, python3 is not supported!')
  main()
