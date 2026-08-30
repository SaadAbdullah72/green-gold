import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/greengold_os';

async function updatePassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'saddar@gmail.com';
    const newPassword = 'saddar123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const result = await mongoose.connection.collection('users').updateOne(
      { email: email },
      { $set: { passwordHash: passwordHash } }
    );

    console.log('MongoDB Update Result matched:', result.matchedCount, 'modified:', result.modifiedCount);

    const user = await mongoose.connection.collection('users').findOne({ email: email });
    console.log('Updated User Details:', user ? { id: user._id, fullName: user.fullName, email: user.email, role: user.role, organizationName: user.organizationName } : 'Not found');

    // Also sync to users.json disk persistence
    const diskPath = './backend/data/users.json';
    if (fs.existsSync(diskPath)) {
      const usersData = JSON.parse(fs.readFileSync(diskPath, 'utf8'));
      const idx = usersData.findIndex(u => (u.email || '').toLowerCase() === email);
      if (idx !== -1) {
        usersData[idx].passwordHash = passwordHash;
      } else if (user) {
        usersData.push(user);
      }
      fs.writeFileSync(diskPath, JSON.stringify(usersData, null, 2));
      console.log('Synced with backend/data/users.json');
    }

    process.exit(0);
  } catch (err) {
    console.error('Password Update Error:', err);
    process.exit(1);
  }
}

updatePassword();
