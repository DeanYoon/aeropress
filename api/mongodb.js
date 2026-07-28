const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('aeroprecipe');

  cachedClient = client;
  cachedDb = db;

  return db;
}

module.exports = { connectToDatabase };