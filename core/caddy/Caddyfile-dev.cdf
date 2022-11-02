{
  debug
  auto_https off
  log {
    format console
  }
}

# note: exclude trailing slash
# wrong: http://localhost/
# correct: http://localhost
http://localhost, http://0.0.0.0 {
  handle /auth/ {
    uri replace /auth/ /
    reverse_proxy host.docker.internal:9090
  }
  handle /studio/ {
    uri replace /studio/ /
    reverse_proxy host.docker.internal:9091
  }
  handle {
    respond 404
  }
}