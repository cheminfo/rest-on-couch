#!/bin/sh

if grep ".only(" test/**/*.js; then
    echo found .only in test file
    exit 1
fi
