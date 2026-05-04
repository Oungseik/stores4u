#!/usr/bin/env bash

MAX_PARALLEL=10

while [[ $# -gt 0 ]]; do
  case $1 in
    --dir=*)
      DIR="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown: $1"
      exit 1
      ;;
  esac
done

if [ -z "$DIR" ]; then
  echo "Error: --dir is required"
  exit 1
fi

if [ ! -d "$DIR" ]; then
  echo "Error: $DIR does not exist"
  exit 1
fi

PIDS=()
COUNT=0

for db_file in "$DIR"/*.db; do
  [ -f "$db_file" ] || continue
  echo "Migrating: $db_file"
  DATABASE_URL="$db_file" bun run --filter @repo/perstore-db db:migrate &
  PIDS+=($!)
  ((COUNT++))

  if (( COUNT >= MAX_PARALLEL )); then
    wait "${PIDS[0]}"
    PIDS=("${PIDS[@:1]}")
    ((COUNT--))
  fi
done

for pid in "${PIDS[@]}"; do
  wait $pid
done

echo "All migrations complete"
