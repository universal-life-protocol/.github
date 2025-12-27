# Deployment

## Web root

`/home/main/tetragrammatron/public` is the public root for static hosting. It can be linked into nginx, Caddy, or a static host.

## Example nginx snippet

```nginx
server {
  listen 80;
  server_name tetragrammatron-os.com www.tetragrammatron-os.com;

  root /home/main/tetragrammatron/public;
  index index.html;

  location /broker/ { try_files $uri /broker/index.html; }
  location /canvas/ { try_files $uri /canvas/index.html; }
  location /wiki/   { try_files $uri /wiki/index.html; }
  location /forum/  { try_files $uri /forum/index.html; }
  location /scene/  { try_files $uri /scene/index.html; }
  location /graph/  { try_files $uri /graph/index.html; }
  location /world/  { autoindex on; }
}
```

## WebSocket relay

If you want live collaboration, proxy `/ws` to the `virtual-revelation-ws` service.

```nginx
location /ws {
  proxy_pass http://127.0.0.1:8787;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "Upgrade";
}
```
