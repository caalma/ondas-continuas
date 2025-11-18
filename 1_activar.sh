#!/bin/bash

. ./pyvenv/bin/activate

CFG_FILE="$1"

cd app/
python server.py $CFG_FILE
