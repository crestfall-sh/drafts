#!/bin/bash

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