import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let DATA_DIR, USERS_FILE, REQUESTS_FILE;

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  DATA_DIR = path.join(__dirname, '../../data');
  USERS_FILE = path.join(DATA_DIR, 'users.json');
  REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

  if (fs && fs.existsSync && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Read-only environment like Vercel Serverless
}

export const saveUsersToDisk = (users) => {
  try {
    if (fs && USERS_FILE) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    }
  } catch (e) {
    // Silently fail on Vercel read-only FS
  }
};

export const loadUsersFromDisk = () => {
  try {
    if (fs && USERS_FILE && fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    // Silently fail
  }
  return [];
};

export const saveRequestsToDisk = (requests) => {
  try {
    if (fs && REQUESTS_FILE) {
      fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf-8');
    }
  } catch (e) {
    // Silently fail on Vercel read-only FS
  }
};

export const loadRequestsFromDisk = () => {
  try {
    if (fs && REQUESTS_FILE && fs.existsSync(REQUESTS_FILE)) {
      const content = fs.readFileSync(REQUESTS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    // Silently fail
  }
  return [];
};
