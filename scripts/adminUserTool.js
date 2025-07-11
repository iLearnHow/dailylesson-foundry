#!/usr/bin/env node
const userService = require('../services/user/userService');

async function main() {
  const [,, cmd, ...args] = process.argv;
  switch (cmd) {
    case 'list': {
      const db = await userService.__proto__.load();
      db.users.forEach(u => {
        console.log(`${u.id} | ${u.email} | credits: ${u.credit_balance} | tier: ${u.tier}`);
      });
      break;
    }
    case 'grant': {
      const [email, amount] = args;
      if (!email || !amount) return console.error('Usage: grant <email> <amount>');
      const db = await userService.__proto__.load();
      const user = db.users.find(u => u.email === email);
      if (!user) return console.error('User not found');
      await userService.incrementCredits(user.id, parseInt(amount));
      console.log(`Granted ${amount} credits to ${email}`);
      break;
    }
    case 'revoke': {
      const [email, amount] = args;
      if (!email || !amount) return console.error('Usage: revoke <email> <amount>');
      const db = await userService.__proto__.load();
      const user = db.users.find(u => u.email === email);
      if (!user) return console.error('User not found');
      await userService.decrementCredits(user.id, parseInt(amount));
      console.log(`Revoked ${amount} credits from ${email}`);
      break;
    }
    case 'find': {
      const [email] = args;
      if (!email) return console.error('Usage: find <email>');
      const db = await userService.__proto__.load();
      const user = db.users.find(u => u.email === email);
      if (!user) return console.error('User not found');
      console.log(user);
      break;
    }
    default:
      console.log('Usage: adminUserTool.js <list|grant|revoke|find> ...');
  }
}

main(); 