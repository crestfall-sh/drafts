# References
# https://gist.githubusercontent.com/joshxyzhimself/5e249ac0f4027b57aa71622f2f86a1b0/raw/1accf4558e575c80a4de6c06631c2c1c7d3d3f7b/example.sh
# https://news.ycombinator.com/item?id=26825300

# bash ./test.sh 6f0a181195f86a726dba153e3877e2a0c53bfdd015640be0896c4f6b91be7007 https://gist.githubusercontent.com/joshxyzhimself/5e249ac0f4027b57aa71622f2f86a1b0/raw/1accf4558e575c80a4de6c06631c2c1c7d3d3f7b/example.sh
# bash ./test.sh --install 93e7e98db4a7a9d240b490dfc9d143477297affcbc24bea0de964523f01b58ad https://gist.githubusercontent.com/joshxyzhimself/5e249ac0f4027b57aa71622f2f86a1b0/raw/1accf4558e575c80a4de6c06631c2c1c7d3d3f7b/example.sh

eq() {
  if [ $1 -eq $2 ]; then
    return 0
  else
    echo $3;
    exit 1
  fi
}

ge() {
  if [ $1 -ge $2 ]; then
    return 0
  else
    echo $3;
    exit 1
  fi
}

if [ "$1" = "--alias" ]; then
  echo "asd"
fi
if [ "$1" = "--install" ]; then
  # echo "HASH: '$2'";
  # echo "URL: '$3'";
  eq ${#2} 64 "Error: ERR_INVALID_HASH_LENGTH"
  ge ${#3} 1 "Error: ERR_INVALID_URL_LENGTH"
  curl --silent --show-error --output ./install.sh $3
  echo "$2 ./install.sh" | sha256sum --check
  bash ./install.sh
  rm --force ./install.sh
fi