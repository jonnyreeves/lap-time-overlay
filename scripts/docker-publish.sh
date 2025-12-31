#!/bin/bash

## build
docker build --platform=linux/amd64 --build-arg BUILD_TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" -t racecraft .

## tag
docker tag racecraft jonnyreeves83/racecraft:latest

## publish
docker push jonnyreeves83/racecraft:latest
