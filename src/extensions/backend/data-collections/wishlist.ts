import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'wishlist';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Wishlist',
  displayField: 'memberId',
  fields: [
    { key: 'memberId', displayName: 'Member ID', type: 'TEXT' },
    { key: 'productId', displayName: 'Product ID', type: 'TEXT' },
    { key: 'slug', displayName: 'Product Slug', type: 'TEXT' },
    { key: 'createdDate', displayName: 'Created Date', type: 'DATETIME' },
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
        { path: 'memberId', order: 'ASC' },
        { path: 'productId', order: 'ASC' },
      ],
    },
  ],
  initialData: [],
} satisfies DataCollection;
