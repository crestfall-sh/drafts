{
  log {
    output file /var/log/caddy/access.log
    format json
  }
}

# note: exclude trailing slash
# wrong: example.com/
# correct: example.com
example.com {
  handle {
    header {
      Cache-Control "no-cache"
      Strict-Transport-Security "max-age=63072000"
      defer
    }
    encode gzip
    reverse_proxy 0.0.0.0:8080
  }
  tls {
    protocols tls1.3
  }
}