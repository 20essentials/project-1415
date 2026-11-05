import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'workshop-waitlist';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Workshop Waitlist',
  displayField: 'email',
  fields: [
    { key: 'workshopId', displayName: 'Workshop ID', type: 'TEXT' },
    { key: 'workshopName', displayName: 'Workshop Name', type: 'TEXT' },
    { key: 'sessionStart', displayName: 'Session Start', type: 'TEXT' },
    { key: 'firstName', displayName: 'First Name', type: 'TEXT' },
    { key: 'email', displayName: 'Email', type: 'TEXT' },
    { key: 'status', displayName: 'Status', type: 'TEXT' },
    { key: 'createdDate', displayName: 'Created Date', type: 'DATETIME' },
    { key: 'updatedDate', displayName: 'Updated Date', type: 'DATETIME' },
  ],
  dataPermissions: {
    itemRead: 'CMS_EDITOR',
    itemInsert: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
    itemRemove: 'CMS_EDITOR',
  },
  indexes: [
    {
      fields: [
        { path: 'sessionStart', order: 'ASC' },
        { path: 'email', order: 'ASC' },
      ],
    },
  ],
  initialData: [],
} satisfies DataCollection;
