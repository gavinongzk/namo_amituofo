import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Initialize the Google Sheets API client
const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
});

// Get the folder ID from environment variable
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1DEKSTTDwEF57MZ9mE4-_csU0YrkQxrB9';

export async function createOrGetSpreadsheet(title: string) {
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Search for existing spreadsheet with the same title in the specified folder
    const response = await drive.files.list({
      q: `name='${title}' and mimeType='application/vnd.google-apps.spreadsheet' and '${FOLDER_ID}' in parents`,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create new spreadsheet if not found
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
      },
    });

    // Move the spreadsheet to the specified folder
    if (spreadsheet.data.spreadsheetId) {
      await drive.files.update({
        fileId: spreadsheet.data.spreadsheetId,
        addParents: FOLDER_ID,
        fields: 'id, parents',
      });
    }

    // Share the spreadsheet with the user's email if provided
    if (process.env.GOOGLE_USER_EMAIL) {
      await drive.permissions.create({
        fileId: spreadsheet.data.spreadsheetId!,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: process.env.GOOGLE_USER_EMAIL,
        },
      });
    }

    return spreadsheet.data.spreadsheetId;
  } catch (error) {
    console.error('Error creating/getting spreadsheet:', error);
    throw error;
  }
}

export async function appendToSheet(spreadsheetId: string, range: string, values: any[][]) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
  } catch (error) {
    console.error('Error appending to sheet:', error);
    throw error;
  }
}

export async function clearSheet(spreadsheetId: string, range: string) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range,
    });
  } catch (error) {
    console.error('Error clearing sheet:', error);
    throw error;
  }
} 