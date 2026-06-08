# docker compose -p developer-website-dev -f compose.yml -f compose-dev.yml --env-file docker.env up --build -d &&
./shells/start-app.sh dev &&
echo "Build dev complete...."

