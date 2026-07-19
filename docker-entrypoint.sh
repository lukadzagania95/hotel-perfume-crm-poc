#!/bin/sh
set -eu

data_dir="${RAILWAY_VOLUME_MOUNT_PATH:-/data}"
mkdir -p "$data_dir"
chown -R nextjs:nodejs "$data_dir"

gosu nextjs node node_modules/prisma/build/index.js migrate deploy
gosu nextjs node node_modules/prisma/build/index.js db seed
exec gosu nextjs "$@"
