#!/bin/bash
set -x

# crestfall-auth
rm ./crestfall-auth/package.json
rm ./crestfall-auth/package-lock.json
rm ./crestfall-auth/.env
rm -rf ./crestfall-auth/node_modules/
ln ./package.json ./crestfall-auth/package.json
ln ./package-lock.json ./crestfall-auth/package-lock.json
ln ./.env ./crestfall-auth/.env
cd ./crestfall-auth/
npm install
cd ../

# crestfall-studio
rm ./crestfall-studio/package.json
rm ./crestfall-studio/package-lock.json
rm ./crestfall-studio/.env
rm -rf ./crestfall-studio/node_modules/
ln ./package.json ./crestfall-studio/package.json
ln ./package-lock.json ./crestfall-studio/package-lock.json
ln ./.env ./crestfall-studio/.env
cd ./crestfall-studio/
npm install
cd ../

# crestfall-core
rm ./crestfall-core/package.json
rm ./crestfall-core/package-lock.json
rm ./crestfall-core/.env
ln ./package.json ./crestfall-core/package.json
ln ./package-lock.json ./crestfall-core/package-lock.json
ln ./.env ./crestfall-core/.env