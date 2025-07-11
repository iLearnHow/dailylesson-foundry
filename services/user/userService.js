const fs = require('fs').promises;
const path = require('path');
const { v4: uuid } = require('uuid');

const DB_PATH = path.join(__dirname, 'database.json');
let cache = null;

async function load() {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    cache = JSON.parse(raw);
  } catch (err) {
    cache = { users: [] };
  }
  return cache;
}

async function save() {
  if (!cache) return;
  await fs.writeFile(DB_PATH, JSON.stringify(cache, null, 2));
}

async function getUserById(id) {
  const db = await load();
  return db.users.find(u => u.id === id) || null;
}

async function getUserByStripeCustomerId(stripeId) {
  const db = await load();
  return db.users.find(u => u.stripe_customer_id === stripeId) || null;
}

async function getUserBySubscriptionId(subId) {
  const db = await load();
  return db.users.find(u => u.subscription_id === subId) || null;
}

async function createUser({ email, name }) {
  const db = await load();
  const user = {
    id: uuid(),
    email,
    name,
    stripe_customer_id: null,
    subscription_id: null,
    tier: null,
    credit_balance: 0
  };
  db.users.push(user);
  await save();
  return user;
}

async function updateUser(user) {
  const db = await load();
  const idx = db.users.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    db.users[idx] = user;
    await save();
    return user;
  }
  throw new Error('User not found');
}

async function incrementCredits(userId, amount) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  user.credit_balance += amount;
  await updateUser(user);
  return user.credit_balance;
}

async function decrementCredits(userId, amount) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  if (user.credit_balance < amount) throw new Error('Insufficient credits');
  user.credit_balance -= amount;
  await updateUser(user);
  return user.credit_balance;
}

module.exports = {
  getUserById,
  getUserByStripeCustomerId,
  getUserBySubscriptionId,
  createUser,
  updateUser,
  incrementCredits,
  decrementCredits
}; 