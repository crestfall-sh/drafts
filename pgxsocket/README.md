# pgxsocket

## Development

```sh
# rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# libclang
sudo apt install libclang-dev -y

# postgresql build dependencies
sudo apt install build-essential libreadline-dev zlib1g-dev flex bison libxml2-dev libxslt-dev libssl-dev libxml2-utils xsltproc ccache -y

# pkg-config
sudo apt install pkg-config -y

# install and initialize
cargo install --locked cargo-pgx
cargo pgx init --pg14=download

# running postgresql
cargo pgx status all
cargo pgx start all
cargo pgx stop all

# compile and run extension
cargo pgx run pg14

# test extension
CREATE EXTENSION pgxsocket;
\df pgsocket.*
```