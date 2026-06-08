# docker compose -p developer-website-prod -f compose.yml -f compose-prod.yml --env-file docker-prod.env up --build -d &&
./shells/start-app.sh prod &&
echo "Build prod complete...."

