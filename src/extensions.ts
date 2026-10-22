import { app } from '@wix/astro/builders';

import dataCollections from './extensions/backend/data-collections/data-collections.extension.ts';

import orderApprovedRestock from './extensions/backend/events/order-approved-restock/order-approved-restock.extension.ts';

import restockAlerts from './extensions/dashboard/pages/restock-alerts/restock-alerts.extension.ts';

export default app().use(dataCollections).use(orderApprovedRestock).use(restockAlerts);