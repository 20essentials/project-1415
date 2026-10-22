import { extensions } from '@wix/astro/builders'

export default extensions.dashboardPage({
  id: '0c78e2a7-a0ba-4d4d-bfb2-340ea049cf7d',
  title: 'Restock Alerts',
  routePath: 'restock-alerts',
  component: './extensions/dashboard/pages/restock-alerts/restock-alerts.tsx',
  fullPage: false,
});
