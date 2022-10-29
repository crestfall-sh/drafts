#!/bin/bash

# References
# https://news.ycombinator.com/item?id=26825300
# https://linuxize.com/post/bash-if-else-statement/
# https://github.com/torokmark/assert.sh/blob/main/assert.sh
# bash ./crestfall.sh --alias
# bash ./crestfall.sh --install 93e7e98db4a7a9d240b490dfc9d143477297affcbc24bea0de964523f01b58ad https://gist.githubusercontent.com/joshxyzhimself/5e249ac0f4027b57aa71622f2f86a1b0/raw/1accf4558e575c80a4de6c06631c2c1c7d3d3f7b/example.sh

eq() {
  if [ $1 -eq $2 ]; then
    return 0
  else
    printf "$3";
    exit 1
  fi
}

ge() {
  if [ $1 -ge $2 ]; then
    return 0
  else
    printf "$3";
    exit 1
  fi
}

if [ "$1" = "--install" ]; then
  sudo cp $BASH_SOURCE /usr/local/bin/crestfall.sh
  sudo chmod +x /usr/local/bin/crestfall.sh
  printf "crestfall.sh --install OK\n"
  exit 0
fi

eq ${#1} 64 "Error: ERR_INVALID_HASH_LENGTH"
ge ${#2} 1 "Error: ERR_INVALID_URL_LENGTH"
curl --silent --show-error --output ./install.sh $2 || exit 1
printf "$1 ./install.sh" | sha256sum --check || exit 1
bash ./install.sh
rm --force ./install.sh
exit 0