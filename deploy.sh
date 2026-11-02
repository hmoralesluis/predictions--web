#!/usr/bin/env bash
# BUCKET=my-bucket DISTRIBUTION_ID=E123ABC ./deploy.sh
set -euo pipefail
: "${BUCKET:?set BUCKET}" "${DISTRIBUTION_ID:?set DISTRIBUTION_ID}"
npm run build
aws s3 sync dist "s3://$BUCKET" --delete --exclude index.html \
  --cache-control "public,max-age=31536000,immutable"
aws s3 cp dist/index.html "s3://$BUCKET/index.html" --cache-control "no-cache"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/index.html"