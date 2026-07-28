const { connectToDatabase } = require('./mongodb');

const COLLECTION = 'brew_history';

export default async function handler(req, res) {
  // CORS for dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    if (req.method === 'POST') {
      const brew = {
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const result = await collection.insertOne(brew);
      return res.status(201).json({ _id: result.insertedId, ...brew });
    }

    if (req.method === 'GET') {
      const { limit = 50 } = req.query;
      const brews = await collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .toArray();
      return res.status(200).json(brews);
    }

    if (req.method === 'PATCH') {
      const { _id, rating, notes } = req.body;
      if (!_id) return res.status(400).json({ error: '_id required' });

      const { ObjectId } = require('mongodb');
      const update = { updatedAt: new Date().toISOString() };
      if (rating !== undefined) update.rating = rating;
      if (notes !== undefined) update.notes = notes;

      await collection.updateOne(
        { _id: new ObjectId(_id) },
        { $set: update }
      );
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { _id } = req.query;
      if (!_id) return res.status(400).json({ error: '_id required' });

      const { ObjectId } = require('mongodb');
      await collection.deleteOne({ _id: new ObjectId(_id) });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}