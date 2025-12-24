#!/bin/bash

## build
docker build --platform=linux/amd64 -t racecraft .

## tag
docker tag racecraft jonnyreeves83/racecraft:latest

## publish
docker push jonnyreeves83/racecraft:latest