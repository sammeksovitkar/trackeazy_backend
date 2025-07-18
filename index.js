const { google } = require('googleapis');
const keys = require('./lofty-scheduler-466207-c9-34f044923fff.json');
const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors()); // This will enable CORS for all routes
app.use(express.json()); // Enable JSON parsing

const spreadsheetId = '1EnSzNTAtdz0CBU8R6KTtc6Rop5a8xw-nPhZdpKxRnm8'; // just the ID
const sheetName = 'Sheet1';

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: keys,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

// 👇 Write headers ONLY if sheet is empty
async function writeHeadersIfEmpty() {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:C1`,
  });

  const headers = response.data.values;
  if (!headers || headers.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:C1`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [['latlong', 'time',]],
      },
    });
    console.log('✅ Headers written to sheet.');
  } else {
    console.log('ℹ️ Headers already exist.');
  }
}

// 👇 Append a new row of data under headers
async function appendToSheet(dataArray) {
  const sheets = await getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A2:C`, // start appending from row 2
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [dataArray],
    },
  });

  console.log('✅ Data appended to Google Sheet.');
}

// POST /data → to send data to the sheet
app.post('/data', async (req, res) => {
  const newData = req.body;
  console.log(newData,"asdfasfd")

  if (!newData.latlong || !newData.time ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await writeHeadersIfEmpty(); // Add headers if not already
    await appendToSheet([newData.latlong, newData.time, ]);

    res.status(201).json({ message: 'Data appended successfully' });
  } catch (error) {
    console.error('Error appending data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /get-sheet-data → to read data from sheet
app.get('/get-sheet-data', async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:C`,
    });

    res.json(result.data.values || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
//app.listen(port, () => {
//  console.log(`🚀 Server running at http://localhost:${port}`);
//});
