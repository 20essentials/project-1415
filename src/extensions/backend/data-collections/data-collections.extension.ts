import { extensions } from '@wix/astro/builders'

import careGuidesCollection from './care-guides';

import lookbookCollection from './lookbook';

import wishlistCollection from './wishlist';

export default extensions.dataCollections({
  id: '9e51c9e9-0726-4bc7-9f9b-4dd93e03edd9',
  name: 'Data Collections',
  collections: [careGuidesCollection, lookbookCollection, wishlistCollection],
});
