#!/bin/bash

# usage
# bash ./init.sh --install
# bash ./init.sh --update
# bash ./init.sh --create-env

if [ "$1" = "--install" ]; then
  echo "--> Installing eslint dependencies."
  rm -rf ./node_modules/
  npm install
fi
if [ "$1" = "--update" ]; then
  echo "--> Updating eslint dependencies."
  npm outdated
  npm update
fi

cd ./auth/
if [ "$1" = "--install" ]; then
  echo "--> Installing auth dependencies."
  rm -rf ./node_modules/
  npm install
fi
if [ "$1" = "--update" ]; then
  echo "--> Updating auth dependencies."
  npm outdated
  npm update
fi
if [ "$1" = "--update-modules" ]; then
  echo "--> Updating crestfall modules."
  npm install github:crestfall-sh/modules
fi
cd ../

cd ./client/
if [ "$1" = "--install" ]; then
  echo "--> Installing client dependencies."
  rm -rf ./node_modules/
  npm install
fi
if [ "$1" = "--update" ]; then
  echo "--> Updating client dependencies."
  npm outdated
  npm update
fi
if [ "$1" = "--update-modules" ]; then
  echo "--> Updating crestfall modules."
  npm install github:crestfall-sh/modules
fi
cd ../

cd ./studio/
if [ "$1" = "--install" ]; then
  echo "--> Installing studio dependencies."
  rm -rf ./node_modules/
  npm install
fi
if [ "$1" = "--update" ]; then
  echo "--> Updating studio dependencies."
  npm outdated
  npm update
fi
if [ "$1" = "--update-modules" ]; then
  echo "--> Updating crestfall modules."
  npm install github:crestfall-sh/modules
fi
cd ../

if [ "$1" = "--create-env" ]; then
  echo "--> Removing .env file symlink."
  rm -f ./core/.env
  echo "--> Removing .env file."
  rm -f ./.env
  echo "--> Creating .env file."
  secret=$(openssl rand -base64 32)
  echo "POSTGRES_USER=postgres" >> .env
  echo "POSTGRES_PASSWORD=postgres" >> .env
  echo "PGRST_DB_SCHEMAS=public,extensions,auth" >> .env
  echo "PGRST_DB_EXTRA_SEARCH_PATH=public,extensions,auth" >> .env
  echo "PGRST_JWT_SECRET=$secret" >> .env
  echo "PGRST_JWT_SECRET_IS_BASE64=true" >> .env
  echo "TYPESENSE_API_KEY=$secret" >> .env
  echo "SMTP_SERVER=smtp.sendgrid.net" >> .env
  echo "SMTP_PORT=587" >> .env
  echo "SMTP_ENCRYPTED_PORT=465" >> .env
  echo "SMTP_USERNAME=apikey" >> .env
  echo "SMTP_PASSWORD=YOUR_SENDGRID_API_KEY" >> .env
  cat ./.env
  echo "--> Creating .env file symlink."
  ln ./.env ./core/.env
fi