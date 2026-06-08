#!/bin/bash

# Load environment from OpenBao
source ./shells/env-bao.sh $1

yarn prisma generate
yarn prisma db push --force-reset
