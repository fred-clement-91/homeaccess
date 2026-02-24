FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    wireguard-tools \
    iptables \
    iproute2 \
    && rm -rf /var/lib/apt/lists/*

COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
