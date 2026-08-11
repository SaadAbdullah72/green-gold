// Persistence layer - safe for serverless (Vercel read-only filesystem)
// On Vercel, disk operations silently fail but don't crash the app

let fs, path;
let DATA_DIR, USERS_FILE, REQUESTS_FILE;

try {
  fs = await import('fs');
  path = await import('path');
  const { fileURLToPath } = await import('url');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  DATA_DIR = path.join(__dirname, '../../data');
  USERS_FILE = path.join(DATA_DIR, 'users.json');
  REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

  // Ensure data directory exists (only works on writable filesystems)
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.log('Persistence: Running on read-only filesystem (Vercel), disk ops disabled.');
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
