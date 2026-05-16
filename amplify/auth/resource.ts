import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['Admin', 'Freelancer'],
  userAttributes: {
    fullname: {
      mutable: true,
    },
  },
});
