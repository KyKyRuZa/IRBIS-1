#!/bin/sh
set -e

# The irbis_uploads named volume is mounted here and is owned by root.
# Fix ownership so the non-root runtime user can write uploaded files.
mkdir -p /app/uploads/certificates /app/uploads/signatures
chown -R nextjs:nodejs /app/uploads

# Apply database migrations on every start so a fresh prod database gets its schema.
echo "Applying database migrations..."
npx prisma migrate deploy

exec su-exec nextjs:nodejs node src/index.js
