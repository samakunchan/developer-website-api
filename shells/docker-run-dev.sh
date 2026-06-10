docker compose -p developer-website-api-dev -f compose.yml -f compose-dev.yml --env-file docker.env up -d --force-recreate &&
echo "Ready to go...."
