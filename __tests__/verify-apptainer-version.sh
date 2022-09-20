#!/bin/sh

if [ -z "$1" ]; then
  echo "Must supply apptainer version argument"
  exit 1
fi

sing_version="$(apptainer --version)"
echo "Found '$sing_version'"
if [ -z "$(echo apptainer version $sing_version | grep $1)" ]; then
  echo "Unexpected version"
  exit 1
fi
