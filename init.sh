#!/bin/bash

echo "Linking .env files.."
rm ./auth/.env
rm ./client/.env
rm ./core/.env
rm ./studio/.env
ln ./.env ./auth/.env
ln ./.env ./client/.env
ln ./.env ./core/.env
ln ./.env ./studio/.env

echo "Installing eslint dependencies.."
rm -rf ./node_modules/
npm install
if [ "$1" = "--update" ]; then
  npm outdated
  npm update
fi

echo "Installing auth dependencies.."
cd ./auth/
rm -rf ./node_modules/
npm install
if [ "$1" = "--update" ]; then
  npm outdated
  npm update
fi
cd ../

echo "Installing client dependencies.."
cd ./client/
rm -rf ./node_modules/
npm install
if [ "$1" = "--update" ]; then
  npm outdated
  npm update
fi
cd ../

echo "Installing studio dependencies.."
cd ./studio/
rm -rf ./node_modules/
npm install
if [ "$1" = "--update" ]; then
  npm outdated
  npm update
fi
cd ../