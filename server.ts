import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = "mongodb+srv://Avdhesh1:ya4XYnQUEtYhv5kr@cluster0.0uojesi.mongodb.net/avtars";

cloudinary.config({
  cloud_name: 'dlkc5p27',
  api_key: '651176491184128',
  api_secret: 'FcjfdU4Z1NjaXw9Zsy4ImlTgHtM'
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const PUBLIC_DIR = path.join(__dirname, 'public');
  if (fs.existsSync(PUBLIC_DIR)) {
    app.use(express.static(PUBLIC_DIR));
  }

  // Explicit static handlers for logo and favicon
  app.get('/logo.png', (req, res) => {
    const pubPath = path.join(__dirname, 'public', 'logo.png');
    const rootPath = path.join(__dirname, 'logo.png');
    if (fs.existsSync(pubPath)) return res.sendFile(pubPath);
    if (fs.existsSync(rootPath)) return res.sendFile(rootPath);
    res.status(404).send('Not found');
  });

  app.get('/favicon.ico', (req, res) => {
    const pubPath = path.join(__dirname, 'public', 'favicon.ico');
    const rootPath = path.join(__dirname, 'favicon.ico');
    if (fs.existsSync(pubPath)) return res.sendFile(pubPath);
    if (fs.existsSync(rootPath)) return res.sendFile(rootPath);
    res.status(404).send('Not found');
  });

  const DATA_DIR = path.join(__dirname, 'data');
  const LINKS_FILE = path.join(DATA_DIR, 'links.json');
  const USERS_FILE = path.join(DATA_DIR, 'users.json');
  const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Initialize local fallback files
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([{ username: 'admin', password: 'password123', name: 'Personal Owner' }], null, 2));
  }
  if (!fs.existsSync(CATEGORIES_FILE)) {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify({}, null, 2));
  }
  if (!fs.existsSync(LINKS_FILE)) {
    fs.writeFileSync(LINKS_FILE, JSON.stringify([], null, 2));
  }

  // Connect to MongoDB
  let mongoDb: any = null;
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    mongoDb = client.db('avtars');
    console.log('Successfully connected to MongoDB Atlas');
  } catch (err) {
    console.error('Failed to connect to MongoDB, using local fallback:', err);
  }

  const readLocalJson = (file: string) => {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return {};
    }
  };

  const writeLocalJson = (file: string, data: any) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  };

  // Helper to extract username from query, header, or body
  const getUsername = (req: express.Request): string => {
    const fromHeader = req.headers['x-username'];
    if (typeof fromHeader === 'string' && fromHeader.trim()) return fromHeader.trim();
    const fromQuery = req.query.username;
    if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery.trim();
    const fromBody = req.body?.username;
    if (typeof fromBody === 'string' && fromBody.trim()) return fromBody.trim();
    return '';
  };

  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    const { username, password, name } = req.body;
    if (!username || !password || !username.trim() || !password.trim()) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();
    const fullName = name && name.trim() ? name.trim() : trimmedUser;

    if (mongoDb) {
      try {
        const existing = await mongoDb.collection('users').findOne({ username: trimmedUser });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Username already exists' });
        }
        const newUser = { username: trimmedUser, password: trimmedPass, name: fullName, createdAt: new Date().toISOString() };
        await mongoDb.collection('users').insertOne(newUser);

        // Seed default categories for this specific user
        const defaultLinkCats = ['General', 'Design', 'Inspiration'].map(name => ({ username: trimmedUser, name, type: 'link' }));
        const defaultPhotoCats = ['General', 'Photography', 'Portraits'].map(name => ({ username: trimmedUser, name, type: 'photo' }));
        await mongoDb.collection('categories').insertMany([...defaultLinkCats, ...defaultPhotoCats]);

        return res.json({ success: true, user: { username: trimmedUser, name: fullName }, token: 'mock-jwt-token-' + Date.now() });
      } catch (err) {
        console.error(err);
      }
    }

    const users = readLocalJson(USERS_FILE);
    const usersList = Array.isArray(users) ? users : [];
    if (usersList.some((u: any) => u.username === trimmedUser)) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    const newUser = { username: trimmedUser, password: trimmedPass, name: fullName };
    usersList.push(newUser);
    writeLocalJson(USERS_FILE, usersList);

    // Local categories seed
    const categoriesObj = readLocalJson(CATEGORIES_FILE);
    if (!categoriesObj[trimmedUser]) {
      categoriesObj[trimmedUser] = {
        link: ['General', 'Design', 'Inspiration'],
        photo: ['General', 'Photography', 'Portraits']
      };
      writeLocalJson(CATEGORIES_FILE, categoriesObj);
    }

    res.json({ success: true, user: { username: trimmedUser, name: fullName }, token: 'mock-jwt-token-' + Date.now() });
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    const trimmedUser = username.trim().toLowerCase();

    let users = [];
    if (mongoDb) {
      try {
        users = await mongoDb.collection('users').find({}).toArray();
        if (users.length === 0) {
          const defaultUser = { username: 'admin', password: 'password123', name: 'Personal Owner' };
          await mongoDb.collection('users').insertOne(defaultUser);
          users = [defaultUser];
        }
      } catch {
        users = readLocalJson(USERS_FILE);
      }
    } else {
      const data = readLocalJson(USERS_FILE);
      users = Array.isArray(data) ? data : [];
    }

    const user = users.find((u: any) => u.username === trimmedUser && u.password === password);
    if (user) {
      res.json({ success: true, user: { username: user.username, name: user.name }, token: 'mock-jwt-token-' + Date.now() });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  });

  // Update credentials
  app.post('/api/auth/update', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    const trimmedUser = (username || '').trim().toLowerCase();
    if (!trimmedUser || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (mongoDb) {
      try {
        const user = await mongoDb.collection('users').findOne({ username: trimmedUser });
        if (user && user.password === oldPassword) {
          await mongoDb.collection('users').updateOne({ username: trimmedUser }, { $set: { password: newPassword } });
          return res.json({ success: true, message: 'Credentials updated successfully' });
        } else {
          return res.status(400).json({ success: false, message: 'Invalid current password' });
        }
      } catch (err) {
        console.error(err);
      }
    }

    const users = readLocalJson(USERS_FILE);
    const usersList = Array.isArray(users) ? users : [];
    const userIndex = usersList.findIndex((u: any) => u.username === trimmedUser);
    if (userIndex !== -1 && usersList[userIndex].password === oldPassword) {
      usersList[userIndex].password = newPassword;
      writeLocalJson(USERS_FILE, usersList);
      res.json({ success: true, message: 'Credentials updated successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid current password' });
    }
  });

  // Get categories by type ('link' or 'photo') for specific user
  app.get('/api/categories', async (req, res) => {
    const username = getUsername(req);
    const type = (req.query.type as string) === 'photo' ? 'photo' : 'link';

    if (!username) {
      const defaultNames = type === 'photo' ? ['General', 'Photography', 'Portraits'] : ['General', 'Design', 'Inspiration'];
      return res.json(defaultNames);
    }

    if (mongoDb) {
      try {
        let cats = await mongoDb.collection('categories').find({ username, type }).toArray();
        if (cats.length === 0) {
          const defaultNames = type === 'photo' ? ['General', 'Photography', 'Portraits'] : ['General', 'Design', 'Inspiration'];
          const defaultDocs = defaultNames.map(name => ({ username, name, type }));
          await mongoDb.collection('categories').insertMany(defaultDocs);
          cats = defaultDocs;
        }
        return res.json(cats.map((c: any) => c.name));
      } catch (err) {
        console.error(err);
      }
    }

    const categoriesObj = readLocalJson(CATEGORIES_FILE);
    const userCategories = categoriesObj[username] || {};
    let list = userCategories[type];
    if (!list || list.length === 0) {
      list = type === 'photo' ? ['General', 'Photography', 'Portraits'] : ['General', 'Design', 'Inspiration'];
      if (!categoriesObj[username]) categoriesObj[username] = {};
      categoriesObj[username][type] = list;
      writeLocalJson(CATEGORIES_FILE, categoriesObj);
    }
    res.json(list);
  });

  // Add category by type ('link' or 'photo') for specific user
  app.post('/api/categories', async (req, res) => {
    const username = getUsername(req);
    const { name, type } = req.body;
    if (!username) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const trimmed = name.trim();
    const catType = type === 'photo' ? 'photo' : 'link';

    if (mongoDb) {
      try {
        const existing = await mongoDb.collection('categories').findOne({ username, name: trimmed, type: catType });
        if (!existing) {
          await mongoDb.collection('categories').insertOne({ username, name: trimmed, type: catType });
        }
        const cats = await mongoDb.collection('categories').find({ username, type: catType }).toArray();
        return res.json({ success: true, categories: cats.map((c: any) => c.name) });
      } catch (err) {
        console.error(err);
      }
    }

    const categoriesObj = readLocalJson(CATEGORIES_FILE);
    if (!categoriesObj[username]) categoriesObj[username] = {};
    if (!categoriesObj[username][catType]) {
      categoriesObj[username][catType] = catType === 'photo' ? ['General', 'Photography'] : ['General', 'Design'];
    }
    if (!categoriesObj[username][catType].includes(trimmed)) {
      categoriesObj[username][catType].push(trimmed);
      writeLocalJson(CATEGORIES_FILE, categoriesObj);
    }
    res.json({ success: true, categories: categoriesObj[username][catType] });
  });

  // Get all items (links & photos) for specific user ONLY (privacy isolation)
  app.get('/api/links', async (req, res) => {
    const username = getUsername(req);
    const type = req.query.type as string; // 'link' or 'photo'

    if (!username) {
      return res.json([]);
    }

    const query: any = { username };
    if (type) query.type = type;

    if (mongoDb) {
      try {
        const items = await mongoDb.collection('links').find(query).sort({ createdAt: -1 }).toArray();
        return res.json(items.map((l: any) => ({
          id: l._id ? l._id.toString() : l.id,
          imageUrl: l.imageUrl,
          category: l.category,
          type: l.type || 'link',
          username: l.username,
          createdAt: l.createdAt
        })));
      } catch (err) {
        console.error(err);
      }
    }

    const items = readLocalJson(LINKS_FILE);
    const itemsList = Array.isArray(items) ? items : [];
    
    // Deduplicate local items by username + imageUrl
    const seen = new Set();
    const uniqueItems = [];
    // Sort descending by createdAt first so we keep the newest
    itemsList.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    
    for (const item of itemsList) {
      const key = `${item.username}_${item.imageUrl}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
      }
    }
    if (uniqueItems.length !== itemsList.length) {
      writeLocalJson(LINKS_FILE, uniqueItems);
    }

    const filtered = uniqueItems.filter((i: any) => i.username === username && (!type || (i.type || 'link') === type));
    res.json(filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  // Create link or photo item for specific user ONLY
  app.post('/api/links', async (req, res) => {
    const username = getUsername(req);
    if (!username) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { imageUrl, category, type, fileBase64 } = req.body;
    let finalImageUrl = imageUrl;
    const itemType = type === 'photo' ? 'photo' : 'link';

    // If fileBase64 is provided, upload to Cloudinary
    if (fileBase64) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
          folder: 'avtars_uploads'
        });
        finalImageUrl = uploadResponse.secure_url;
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        return res.status(500).json({ success: false, message: 'Failed to upload image to Cloudinary' });
      }
    }

    if (!finalImageUrl || typeof finalImageUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'Image URL or file is required' });
    }

    const trimmedUrl = finalImageUrl.trim();

    if (mongoDb) {
      try {
        // Check if already exists for this user
        const existing = await mongoDb.collection('links').findOne({ username, imageUrl: trimmedUrl });
        if (existing) {
          return res.status(400).json({ success: false, message: 'This image link is already in your dashboard.' });
        }

        const result = await mongoDb.collection('links').insertOne({
          username,
          imageUrl: trimmedUrl,
          category: category && typeof category === 'string' ? category.trim() : 'General',
          type: itemType,
          createdAt: new Date().toISOString()
        });
        return res.json({
          success: true,
          link: {
            id: result.insertedId.toString(),
            username,
            imageUrl: trimmedUrl,
            category: category && typeof category === 'string' ? category.trim() : 'General',
            type: itemType,
            createdAt: new Date().toISOString()
          }
        });
      } catch (err) {
        console.error(err);
      }
    }

    const items = readLocalJson(LINKS_FILE);
    const itemsList = Array.isArray(items) ? items : [];
    
    // Check if already exists locally
    if (itemsList.some((i: any) => i.username === username && i.imageUrl === trimmedUrl)) {
      return res.status(400).json({ success: false, message: 'This image link is already in your dashboard.' });
    }

    const fallbackItem = {
      id: 'item_' + Date.now(),
      username,
      imageUrl: trimmedUrl,
      category: category && typeof category === 'string' ? category.trim() : 'General',
      type: itemType,
      createdAt: new Date().toISOString()
    };
    itemsList.push(fallbackItem);
    writeLocalJson(LINKS_FILE, itemsList);
    res.json({ success: true, link: fallbackItem });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
