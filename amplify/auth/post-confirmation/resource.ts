import { defineFunction } from '@aws-amplify/backend';

export const postConfirmation = defineFunction({
  name: 'post-confirmation-add-freelancer',
  resourceGroupName: 'auth',
});
