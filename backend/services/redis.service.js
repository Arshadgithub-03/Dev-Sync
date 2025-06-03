import Redis from 'ioredis';

// Create a Redis client using environment variables
const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

// Log when Redis is connected
redisClient.on('connect', () => {
    console.log('Redis Connected');
})

export default redisClient;