/**
 * Google Drive API Integration Helpers
 * Client-side integration using fetch with OAuth 2.0 Access Token
 */

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

/**
 * Lists files of type JSON or CSV from Google Drive, specifically looking for telemetry logs
 */
export async function listDriveFiles(accessToken: string): Promise<GoogleDriveFile[]> {
  try {
    const q = encodeURIComponent(
      "mimeType = 'application/json' or mimeType = 'text/csv' and trashed = false"
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=50`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing Google Drive files:', error);
    throw error;
  }
}

/**
 * Uploads a text file (JSON or CSV telemetry log) to Google Drive using multipart upload
 */
export async function uploadToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string
): Promise<GoogleDriveFile> {
  try {
    const metadata = {
      name: fileName,
      mimeType: mimeType,
      description: 'Telemetry logs from Vision Telemetry Matrix App',
    };

    const boundary = '---------VISION_BOUNDARY_MULTIPART';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + mimeType + '\r\n\r\n' +
      content +
      closeDelim;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive Upload error: ${response.status} - ${errText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    throw error;
  }
}

/**
 * Downloads the content of a specific file from Google Drive
 */
export async function downloadFromDrive(accessToken: string, fileId: string): Promise<string> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive Download error: ${response.status} - ${errText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error downloading from Google Drive:', error);
    throw error;
  }
}

/**
 * Deletes a file from Google Drive (moves to trash or deletes)
 * MANDATORY: Always seek explicit user confirmation dialog before invoking this!
 */
export async function deleteFromDrive(accessToken: string, fileId: string): Promise<void> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive Delete error: ${response.status} - ${errText}`);
    }
  } catch (error) {
    console.error('Error deleting from Google Drive:', error);
    throw error;
  }
}
