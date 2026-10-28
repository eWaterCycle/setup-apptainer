#!/bin/sh

if [ -z "$1" ]; then
	echo "Must supply apptainer version argument"
	exit 1
fi

sing_version="$(apptainer --version)"
echo "Found '$sing_version'"
if ! printf '%s\n' "$sing_version" | grep -Fq -- "$1"; then
	echo "Unexpected version"
	exit 1
fi
