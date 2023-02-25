#!/bin/bash

# usage:
# bash ./env.sh

echo "--> Removing .env file."
rm -f ./.env

echo "--> Creating .env file."
PGRST_JWT_SECRET=$(openssl rand -base64 32)
TYPESENSE_API_KEY=$(openssl rand -hex 32)
TYPESENSE_SEARCH_ONLY_KEY=$(openssl rand -hex 32)
echo "POSTGRES_USER=postgres" >> .env
echo "POSTGRES_PASSWORD=postgres" >> .env
echo "PGRST_DB_SCHEMAS=public" >> .env
echo "PGRST_DB_EXTRA_SEARCH_PATH=public" >> .env
echo "PGRST_JWT_SECRET=$PGRST_JWT_SECRET" >> .env
echo "PGRST_JWT_SECRET_IS_BASE64=true" >> .env
echo "TYPESENSE_API_KEY=$TYPESENSE_API_KEY" >> .env
echo "TYPESENSE_SEARCH_ONLY_KEY=$TYPESENSE_SEARCH_ONLY_KEY" >> .env

echo "--> Reading .env file."
cat ./.env