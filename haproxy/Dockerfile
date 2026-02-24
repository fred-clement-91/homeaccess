FROM haproxy:2.9-alpine

USER root

RUN mkdir -p /usr/local/etc/haproxy/dynamic \
             /usr/local/etc/haproxy/certs \
             /var/run/haproxy

COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg
COPY errors/ /usr/local/etc/haproxy/errors/

RUN chown -R haproxy:haproxy /var/run/haproxy

USER haproxy

EXPOSE 80 443
