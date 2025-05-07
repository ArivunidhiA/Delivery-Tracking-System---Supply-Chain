const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supply-chain';

async function seedUser() {
  await mongoose.connect(MONGODB_URI);

  const email = 'test@example.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Test user already exists.');
    process.exit(0);
  }

  const user = new User({
    firstName: 'Test',
    lastName: 'User',
    email,
    phone: '1234567890',
    password: hashedPassword,
    role: 'admin',
  });
  await user.save();
  console.log('Test user created:', email, '/ password123');
  process.exit(0);
}

seedUser().catch((err) => {
  console.error(err);
  process.exit(1);
}); 