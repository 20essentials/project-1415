import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'restock-alerts';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Restock Alerts',
  displayField: 'productId',
  fields: [
    { key: 'orderId', displayName: 'Order ID', type: 'TEXT' },
    { key: 'productId', displayName: 'Product ID', type: 'TEXT' },
    { key: 'slug', displayName: 'Product Slug', type: 'TEXT' },
    { key: 'remaining', displayName: 'Remaining', type: 'NUMBER' },
    { key: 'threshold', displayName: 'Threshold', type: 'NUMBER' },
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
        { path: 'orderId', order: 'ASC' },
        { path: 'productId', order: 'ASC' },
      ],
    },
  ],
  initialData: [],
} satisfies DataCollection;
