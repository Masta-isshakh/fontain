import fs from 'node:fs';
import { Amplify } from 'aws-amplify';
import { signUp } from 'aws-amplify/auth';

const username = process.argv[2];
const password = process.argv[3];
const fullName = process.argv[4] ?? 'QA Signup';

if (!username || !password) {
  console.error('Usage: node scripts/verify-signup.mjs <email> <password> [fullName]');
  process.exit(1);
}

const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
Amplify.configure(outputs);

try {
  const result = await signUp({
    username: username.toLowerCase().trim(),
    password,
    options: {
      userAttributes: {
        email: username.toLowerCase().trim(),
        name: fullName,
      },
    },
  });
  console.log(JSON.stringify({ ok: true, result }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ ok: false, name: error?.name, message: error?.message }, null, 2));
  process.exit(2);
}
