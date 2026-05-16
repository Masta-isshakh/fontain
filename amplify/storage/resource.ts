import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'fontainStorage',
  access: (allow) => ({
    'home-images/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
    'home-videos/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
    'course-videos/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
    'course-thumbnails/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
    'project-files/{entity_id}/*': [
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
      allow.entity('identity').to(['read']),
    ],
    'profile-images/{entity_id}/*': [
      allow.authenticated.to(['read']),
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
  }),
});
