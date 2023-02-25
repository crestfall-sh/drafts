# pgxsocket

- https://cheats.rs/
- https://doc.rust-lang.org/book/ch01-03-hello-cargo.html
- https://github.com/rust-lang/socket2/blob/master/tests/socket.rs
- https://docs.rs/socket2/latest/socket2/struct.Socket.html#method.send
- https://github.com/tcdi/pgx

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
cargo pgx status all
cargo pgx start all
cargo pgx stop all

# create extension
cargo pgx new pgxsocket
cargo pgx new --bgworker pgwebsocket
cd ./pgwebsocket

# compile and run extension
cargo pgx run pg14
```

```sql
-- test extension
CREATE EXTENSION pgxsocket;
\df pgsocket.*
SELECT hello_pgxsocket();
```