# https://www.haproxy.com/blog/how-to-install-haproxy-on-ubuntu/
# https://haproxy.debian.net/#distribution=Ubuntu&release=jammy&version=2.7
# https://docs.haproxy.org/
apt-get install --no-install-recommends software-properties-common
add-apt-repository ppa:vbernat/haproxy-2.7 --yes
apt-get install haproxy=2.7.\* --yes

# https://certbot.eff.org/instructions?ws=haproxy&os=ubuntufocal&tab=standard
snap install core; sudo snap refresh core
snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot

certbot certonly --standalone --noninteractive --preferred-challenges http --domain test.crestfall.sh --register-unsafely-without-email --agree-tos
certbot renew --pre-hook "service haproxy stop" --post-hook "service haproxy start"

certbot certonly --manual --noninteractive --preferred-challenges=http --domain=test.crestfall.sh

# https://ssl-config.mozilla.org/#server=haproxy&version=2.1&config=modern&openssl=1.1.1k&guideline=5.6