const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('✅ Connected to MongoDB'));

// Define Schema
const locationSchema = new mongoose.Schema({
  latlong: {lat:String,long:String},
  time: String,
}, { timestamps: true });

// Define Model
const Location = mongoose.model('Location', locationSchema);

// POST /data → to save data to MongoDB
app.post('/data', async (req, res) => {
  const newData = req.body;
  console.log(newData, '📦 Incoming data');

  if (!newData.latlong || !newData.time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const location = new Location({
      latlong: {lat:newData.latlong.lat,long:newData.latlong.long},
      time: newData.time,
    });

    await location.save();
    res.status(201).json({ message: '✅ Data saved to MongoDB' });
  } catch (error) {
    console.error('❌ Error saving data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /get-sheet-data → to fetch all records
app.get('/get-sheet-data', async (req, res) => {
  try {
    const data = await Location.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
