{
  docker run --name lo-stack --restart always \
  --memory 1g \
  -e PERSISTENCE=1 \
  -v $HOME/lo-stack-volume:/var/lib/localstack \
  -p 4566:4566 \
  -d ghcr.io/jobscale/localstack:debian
  docker logs --since 5m -f lo-stack
}
