import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  Badge,
  Box,
  Button,
  Card,
  EmptyState,
  Loader,
  Page,
  Table,
  TableToolbar,
  Tabs,
  Text,
  WixDesignSystemProvider,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import type {
  RestockAlert,
  RestockAlertStatus,
} from '../../../../features/restock-alerts/restock-alert';
import {
  listAlerts,
  resolveAlert,
} from '../../../../features/restock-alerts/restock-alerts-repository';

type StatusFilter = RestockAlertStatus | 'all';

const TABS: { id: StatusFilter; title: string }[] = [
  { id: 'pending', title: 'Pending' },
  { id: 'resolved', title: 'Resolved' },
  { id: 'all', title: 'All' },
];

function statusBadge(status: RestockAlertStatus) {
  return status === 'resolved' ? (
    <Badge skin="success">Resolved</Badge>
  ) : (
    <Badge skin="warning">Pending</Badge>
  );
}

const DashboardPage: FC = () => {
  const [activeTab, setActiveTab] = useState<StatusFilter>('pending');
  const [alerts, setAlerts] = useState<RestockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = useCallback(async (filter: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listAlerts(filter === 'all' ? undefined : filter);
      setAlerts(result);
    } catch (loadError) {
      console.error('[restock-alerts] dashboard load failed:', loadError);
      setError('Could not load restock alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(activeTab);
  }, [activeTab, load]);

  const handleResolve = useCallback(
    async (alert: RestockAlert) => {
      setResolvingId(alert._id);
      try {
        await resolveAlert(alert._id);
        dashboard.showToast({ message: 'Alert marked as resolved.', type: 'success' });
        await load(activeTab);
      } catch (resolveError) {
        console.error('[restock-alerts] resolve failed:', resolveError);
        dashboard.showToast({ message: 'Could not resolve the alert.', type: 'error' });
      } finally {
        setResolvingId(null);
      }
    },
    [activeTab, load],
  );

  const columns = useMemo(
    () => [
      {
        title: 'Product',
        render: (alert: RestockAlert) => (
          <Text weight="normal">{alert.slug || alert.productId}</Text>
        ),
      },
      {
        title: 'Remaining',
        render: (alert: RestockAlert) => <Text>{alert.remaining}</Text>,
      },
      {
        title: 'Threshold',
        render: (alert: RestockAlert) => <Text>{alert.threshold}</Text>,
      },
      {
        title: 'Status',
        render: (alert: RestockAlert) => statusBadge(alert.status),
      },
      {
        title: '',
        render: (alert: RestockAlert) =>
          alert.status === 'pending' ? (
            <Button
              size="small"
              priority="secondary"
              disabled={resolvingId === alert._id}
              onClick={() => void handleResolve(alert)}
            >
              Mark resolved
            </Button>
          ) : null,
      },
    ],
    [handleResolve, resolvingId],
  );

  return (
    <WixDesignSystemProvider>
      <Page>
        <Page.Header
          title="Restock Alerts"
          subtitle="Products that ran low after a paid order. Mark each one resolved once it is restocked."
        />
        <Page.Content>
          <Tabs
            activeId={activeTab}
            items={TABS.map((tab) => ({ id: tab.id, title: tab.title }))}
            onClick={(tab) => setActiveTab(tab.id as StatusFilter)}
          />
          <Box marginTop="SP4">
            {loading ? (
              <Box align="center" padding="SP6">
                <Loader size="medium" />
              </Box>
            ) : error ? (
              <EmptyState title="Something went wrong" subtitle={error} skin="page" />
            ) : alerts.length === 0 ? (
              <EmptyState
                title="No restock alerts"
                subtitle="Nothing is low on stock right now."
                skin="page"
              />
            ) : (
              <Card hideOverflow>
                <Table data={alerts} columns={columns}>
                  <TableToolbar>
                    <TableToolbar.Title>{alerts.length} alerts</TableToolbar.Title>
                  </TableToolbar>
                  <Table.Content />
                </Table>
              </Card>
            )}
          </Box>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;
