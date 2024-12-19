export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  redisUrl: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
