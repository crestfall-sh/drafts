#!/bin/bash

echo "--> Creating symlinks of .env file."
rm -f ./core/.env
ln ./.env ./core/.env

echo "--> Installing eslint dependencies."
rm -rf ./node_modules/
npm install
if [ "$1" = "--update" ]; then
  npm outdated
  npm update
fi

echo "--> Installing auth dependencies."
cd ./auth/
rm -rf ./node_modules/
npm install
if [ "$1" = "--update" ]; then
  npm outdated
  npm update
fi
cd ../

echo "--> Installing client dependencies."
cd ./client/
rm -rf ./node_modules/
npm install
if [ "$1" = "--update" ]; then
  npm outdated
  npm update
fi
cd ../

echo "--> Installing studio dependencies."
cd ./studio/
rm -rf ./node_modules/
npm install
if [ "$1" = "--update" ]; then
  npm outdated
  npm update
fi
cd ../
