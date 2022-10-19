#!/bin/bash
set -x

# auth
rm ./auth/package.json
rm ./auth/package-lock.json
rm ./auth/.env
rm -rf ./auth/node_modules/
ln ./package.json ./auth/package.json
ln ./package-lock.json ./auth/package-lock.json
ln ./.env ./auth/.env
cd ./auth/
npm install
cd ../

# studio
rm ./studio/package.json
rm ./studio/package-lock.json
rm ./studio/.env
rm -rf ./studio/node_modules/
ln ./package.json ./studio/package.json
ln ./package-lock.json ./studio/package-lock.json
ln ./.env ./studio/.env
cd ./studio/
npm install
cd ../

# core
rm ./core/package.json
rm ./core/package-lock.json
rm ./core/.env
ln ./package.json ./core/package.json
ln ./package-lock.json ./core/package-lock.json
ln ./.env ./core/.env