import { useCallback, useEffect, useState } from 'react';
import { ApiError, fetchOrders } from '../lib/api';
import type { OrderRequest } from '../types';

const PACKAGE_LABELS: Record<OrderRequest['packageType'], string> = {
  '5kg_box': '5kg Box',
  '10kg_box': '10kg Box',
  full_pallet: 'Full Pallet',
  container: 'Container (20MT)',
};

export const OrdersDashboard = (): JSX.Element => {
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setOrders(await fetchOrders());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Order Requests</h2>
          <p>Captured by the AI assistant — sales team follows up with quotes.</p>
        </div>
        <button type="button" className="clear-button" onClick={() => void load()} disabled={isLoading}>
          Refresh
        </button>
      </div>

      {error !== null && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button type="button" className="retry-button" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="dashboard-note">Loading order requests…</p>
      ) : orders.length === 0 ? (
        <p className="dashboard-note">
          No order requests yet. Place one through the chat to see it appear here.
        </p>
      ) : (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Destination</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderNumber}>
                  <td className="order-number">{order.orderNumber}</td>
                  <td>
                    {PACKAGE_LABELS[order.packageType]} · {order.filletSize} fillets
                  </td>
                  <td>{order.quantity}</td>
                  <td>{order.destination}</td>
                  <td>{order.companyName}</td>
                  <td>
                    {order.email}
                    {order.phone !== undefined ? ` · ${order.phone}` : ''}
                  </td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>
                    <span className="status-chip">Pending review</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
