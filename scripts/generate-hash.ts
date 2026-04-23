import bcrypt from 'bcrypt';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the password to hash: ', async (password) => {
  if (!password) {
    console.error('Password cannot be empty.');
    rl.close();
    process.exit(1);
  }

  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`\nGenerated bcrypt hash:\n${hash}\n`);
    console.log('Update your .env file with:');
    console.log(`ADMIN_PASSWORD="${hash}"`);
  } catch (error) {
    console.error('Error generating hash:', error);
  } finally {
    rl.close();
  }
});
