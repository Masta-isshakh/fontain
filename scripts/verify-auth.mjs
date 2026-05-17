import fs from 'node:fs';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';

const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
Amplify.configure(outputs);

const tests = [
  { username: 'qa.admin@fontain.app', password: 'Password123!' },
  { username: 'qa.freelancer@fontain.app', password: 'Password123!' },
];

for (const test of tests) {
  try {
    const result = await signIn({ username: test.username, password: test.password });
    const session = await fetchAuthSession();
    const groups = session.tokens?.accessToken?.payload?.['cognito:groups'] ?? [];
    console.log(
      `LOGIN_OK user=${test.username} isSignedIn=${String(result.isSignedIn)} nextStep=${result.nextStep?.signInStep ?? 'NONE'} groups=${JSON.stringify(groups)}`
    );
    await signOut();
  } catch (error) {
    const name = error?.name ?? 'Error';
    const message = error?.message ?? String(error);
    console.log(`LOGIN_FAIL user=${test.username} name=${name} message=${message}`);
  }
}
