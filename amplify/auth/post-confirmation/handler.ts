import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import {
  AdminAddUserToGroupCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient();
const FREELANCER_GROUP_NAME = 'Freelancer';

export const handler: PostConfirmationTriggerHandler = async (event) => {
  await cognito.send(
    new AdminAddUserToGroupCommand({
      GroupName: FREELANCER_GROUP_NAME,
      Username: event.userName,
      UserPoolId: event.userPoolId,
    })
  );

  return event;
};
