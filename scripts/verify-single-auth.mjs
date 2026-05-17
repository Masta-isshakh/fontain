import fs from 'node:fs';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error('Usage: node scripts/verify-single-auth.mjs <username> <password>');
  process.exit(1);
}

const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
Amplify.configure(outputs);

try {
  const result = await signIn({ username, password });
  const session = await fetchAuthSession();
  const payload = session.tokens && session.tokens.accessToken && session.tokens.accessToken.payload ? session.tokens.accessToken.payload : {};
  const groups = payload['cognito:groups'] || [];
  console.log(`LOGIN_OK user=${username} isSignedIn=${String(result.isSignedIn)} nextStep=${result.nextStep?.signInStep ?? 'NONE'} groups=${JSON.stringify(groups)}`);
  await signOut();
} catch (error) {
  const name = error && error.name ? error.name : 'Error';
  const message = error && error.message ? error.message : String(error);
  console.log(`LOGIN_FAIL user=${username} name=${name} message=${message}`);
  process.exit(2);
}
