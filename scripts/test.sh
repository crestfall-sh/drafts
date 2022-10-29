# References
# https://gist.githubusercontent.com/joshxyzhimself/5e249ac0f4027b57aa71622f2f86a1b0/raw/1accf4558e575c80a4de6c06631c2c1c7d3d3f7b/example.sh
# https://news.ycombinator.com/item?id=26825300

# bash ./test.sh 6f0a181195f86a726dba153e3877e2a0c53bfdd015640be0896c4f6b91be7007 https://gist.githubusercontent.com/joshxyzhimself/5e249ac0f4027b57aa71622f2f86a1b0/raw/1accf4558e575c80a4de6c06631c2c1c7d3d3f7b/example.sh

echo "hash: $1";
echo "url: $2";

assert() {
  if [ "$1" == "$2" ]; then
    echo "$1 != $2; $3";
    exit 1
  fi
}

gt() {
  if [ $1 -ge $2 ]; then
    return 0
  else
    echo "$1 != $2; $3";
    exit 1
  fi
}

assert ${#1} 64 "INVALID_HASH_LENGTH"

curl --silent --show-error --output ./temp.sh $2
echo "$1 ./temp.sh" | sha256sum --check
bash ./temp.sh
rm --force ./temp.sh