// Test Redis connection directly
// Manually load env vars since we don't have dotenv
process.env.REDIS_HOST = 'redis-12893.c8.us-east-1-4.ec2.cloud.redislabs.com';
process.env.REDIS_PORT = '12893';
process.env.REDIS_USERNAME = 'default';
process.env.REDIS_PASSWORD = 'YpRcCXw3FsIGGaTowqcMjwnU7AMUlkeS';

async function testRedis() {
  console.log('\n=== Testing Redis Connection ===\n');

  console.log('Environment Variables:');
  console.log('- REDIS_HOST:', process.env.REDIS_HOST);
  console.log('- REDIS_PORT:', process.env.REDIS_PORT);
  console.log('- REDIS_USERNAME:', process.env.REDIS_USERNAME);
  console.log(
    '- REDIS_PASSWORD:',
    process.env.REDIS_PASSWORD ? '***' + process.env.REDIS_PASSWORD.slice(-4) : 'NOT SET'
  );

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('redis');

  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      connectTimeout: 10000,
    },
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  });

  client.on('error', (err) => console.error('Redis Client Error:', err));
  client.on('connect', () => console.log('✓ Redis socket connected'));
  client.on('ready', () => console.log('✓ Redis client ready'));
  client.on('reconnecting', () => console.log('→ Redis reconnecting...'));
  client.on('end', () => console.log('× Redis connection closed'));

  try {
    console.log('\nAttempting to connect...');
    await client.connect();

    console.log('Sending PING...');
    const response = await client.ping();
    console.log('PING response:', response);

    console.log('\nTesting SET/GET...');
    await client.set('test:key', 'Hello Redis!');
    const value = await client.get('test:key');
    console.log('Retrieved value:', value);

    await client.del('test:key');
    console.log('Cleaned up test key');

    console.log('\n✓ Redis connection test PASSED\n');
  } catch (error) {
    console.error('\n× Redis connection test FAILED:');
    console.error(error.message);
    console.error('\nFull error:', error);
  } finally {
    await client.quit();
    console.log('Connection closed');
    process.exit(0);
  }
}

testRedis();
