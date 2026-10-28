import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  ShoppingBag,
  Truck,
  BarChart3,
  Check,
  X,
  Eye,
  AlertTriangle,
  RefreshCw,
  Search,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  User,
  Phone,
  Weight,
  Clock,
  Navigation,
} from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import SidebarLayout from '../../components/SidebarLayout';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../utils/api';
import './FpoDashboard.css';

// Leaflet custom marker helpers (pure CSS/HTML divIcon, zero 404 asset glitches)
const hubIcon = L.divIcon({
  className: 'custom-hub-pin',
  html: `<div style="background:#183d2b; color:#ffffff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.35); font-weight:700; font-size:11px; letter-spacing:0.5px;">HUB</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

const createStopIcon = (num) =>
  L.divIcon({
    className: 'custom-stop-pin',
    html: `<div style="background:#2e7d4f; color:#ffffff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-weight:700; font-size:12px;">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -15],
  });

const defaultCustomerIcon = L.divIcon({
  className: 'custom-customer-pin',
  html: `<div style="background:#5e7764; color:#ffffff; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 2px 5px rgba(0,0,0,0.25); font-weight:700; font-size:11px;">&bull;</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -13],
});

// Helper component to auto-recenter/bound Leaflet map
function MapBoundsUpdater({ bounds, center }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else if (center) {
      map.setView(center, 12);
    }
  }, [bounds, center, map]);
  return null;
}

export default function FpoDashboard() {
  const [activeNav, setActiveNav] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Data states
  const [pendingListings, setPendingListings] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryGroups, setDeliveryGroups] = useState([]);

  // Modals & Drawers
  const [previewImage, setPreviewImage] = useState(null);
  const [rejectModalListing, setRejectModalListing] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);

  // Orders filtering
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Dispatch clustering states
  const [maxKm, setMaxKm] = useState(8);
  const [maxKg, setMaxKg] = useState(200);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [clustering, setClustering] = useState(false);
  const [proposedGroups, setProposedGroups] = useState([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [confirmingGroup, setConfirmingGroup] = useState(false);
  const [fpoHubCoords, setFpoHubCoords] = useState([18.4975, 73.8697]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'review', label: 'Produce Review', icon: CheckSquare },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'dispatch', label: 'Dispatch', icon: Truck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  // Load all initial FPO data
  const loadFpoData = async () => {
    try {
      setErrorMessage('');
      const [pendingRes, ordersRes, groupsRes, marketRes] = await Promise.all([
        api.get('/listings/pending'),
        api.get('/orders'),
        api.get('/dispatch/groups'),
        api.get('/listings'),
      ]);

      if (pendingRes.data.success) {
        setPendingListings(pendingRes.data.listings || []);
      }
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.orders || []);
      }
      if (groupsRes.data.success) {
        setDeliveryGroups(groupsRes.data.groups || []);
      }
      if (marketRes.data.success) {
        setAllListings(marketRes.data.listings || []);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to fetch hub data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFpoData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFpoData();
  };

  // Review actions
  const handleApprove = async (listingId) => {
    try {
      setErrorMessage('');
      const res = await api.patch(`/listings/${listingId}/review`, { status: 'approved' });
      if (res.data.success) {
        setSuccessMessage('Produce listing successfully approved and published to marketplace.');
        setPendingListings((prev) => prev.filter((item) => String(item._id || item.id) !== String(listingId)));
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to approve produce.');
    }
  };

  const handleOpenRejectModal = (listing) => {
    setRejectModalListing(listing);
    setRejectionReason('');
  };

  const handleSubmitReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setErrorMessage('Please state a valid reason for rejection.');
      return;
    }
    setSubmittingReview(true);
    try {
      setErrorMessage('');
      const listingId = String(rejectModalListing._id || rejectModalListing.id);
      const res = await api.patch(`/listings/${listingId}/review`, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
      });
      if (res.data.success) {
        setSuccessMessage('Listing rejected with feedback provided to farmer.');
        setPendingListings((prev) => prev.filter((item) => String(item._id || item.id) !== listingId));
        setRejectModalListing(null);
        setRejectionReason('');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to reject produce.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Dispatch clustering actions
  const placedOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'placed');
  }, [orders]);

  const toggleSelectOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAllOrders = () => {
    if (selectedOrderIds.length === placedOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(placedOrders.map((o) => String(o._id || o.id)));
    }
  };

  const handleRunGrouping = async () => {
    setClustering(true);
    setErrorMessage('');
    try {
      const payload = {
        orderIds: selectedOrderIds.length > 0 ? selectedOrderIds : undefined,
        maxKm: Number(maxKm),
        maxKg: Number(maxKg),
      };
      const res = await api.post('/dispatch/group', payload);
      if (res.data.success) {
        setProposedGroups(res.data.proposedGroups || []);
        setSelectedGroupIndex(0);
        if (res.data.hub?.lat && res.data.hub?.lng) {
          setFpoHubCoords([res.data.hub.lat, res.data.hub.lng]);
        }
        setSuccessMessage(
          `Generated ${res.data.groupsGenerated} optimized dispatch group(s) across ${res.data.totalOrdersConsidered} orders.`
        );
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Grouping generation failed.');
    } finally {
      setClustering(false);
    }
  };

  const handleConfirmGroup = async (group) => {
    setConfirmingGroup(true);
    setErrorMessage('');
    try {
      const orderIds = group.orders.map((o) => String(o._id || o.id));
      const res = await api.post('/dispatch/confirm', {
        orderIds,
        stopOrder: group.stopOrder,
        routeGeometry: group.routeGeometry,
        totalDistanceKm: group.totalDistanceKm,
        totalDurationMin: group.totalDurationMin,
        totalWeightKg: group.totalWeightKg,
      });

      if (res.data.success) {
        setSuccessMessage(`Delivery group confirmed! ${orderIds.length} orders marked as Shipped.`);
        setProposedGroups((prev) => prev.filter((g) => g !== group));
        setSelectedOrderIds([]);
        loadFpoData();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to confirm dispatch.');
    } finally {
      setConfirmingGroup(false);
    }
  };

  const handleMarkDelivered = async (groupId) => {
    try {
      setErrorMessage('');
      const res = await api.patch(`/dispatch/${groupId}/delivered`);
      if (res.data.success) {
        setSuccessMessage('Delivery group and all member orders successfully marked as Delivered.');
        loadFpoData();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update delivery status.');
    }
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      const orderIdStr = String(o._id || o.id || '').toLowerCase();
      const customerStr = String(o.customerName || '').toLowerCase();
      const addressStr = String(o.deliveryAddress || '').toLowerCase();
      const query = orderSearchQuery.toLowerCase();
      const matchesSearch = !query || orderIdStr.includes(query) || customerStr.includes(query) || addressStr.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  // Leaflet map coordinates for the active group
  const activeGroup = proposedGroups[selectedGroupIndex] || null;

  const mapPolylineCoords = useMemo(() => {
    if (!activeGroup || !activeGroup.routeGeometry?.coordinates) return [];
    // GeoJSON is [lng, lat], Leaflet polyline requires [lat, lng]
    return activeGroup.routeGeometry.coordinates.map((c) => [c[1], c[0]]);
  }, [activeGroup]);

  const mapBounds = useMemo(() => {
    const points = [fpoHubCoords];
    if (activeGroup && activeGroup.orders) {
      activeGroup.orders.forEach((o) => {
        if (o.deliveryLat && o.deliveryLng) {
          points.push([o.deliveryLat, o.deliveryLng]);
        }
      });
    } else if (placedOrders.length > 0) {
      placedOrders.forEach((o) => {
        if (o.deliveryLat && o.deliveryLng) {
          points.push([o.deliveryLat, o.deliveryLng]);
        }
      });
    }
    return points.length > 1 ? points : null;
  }, [activeGroup, fpoHubCoords, placedOrders]);

  // Overview Stats
  const stats = {
    pendingProduceCount: pendingListings.length,
    activeProduceCount: allListings.length,
    openOrdersCount: placedOrders.length,
    dispatchedGroupsCount: deliveryGroups.length,
    totalRevenue: orders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    totalDeliveredOrders: orders.filter((o) => o.status === 'delivered').length,
    totalKgDispatched: deliveryGroups.reduce((sum, g) => sum + (g.totalWeightKg || 0), 0),
  };

  return (
    <SidebarLayout
      title="FPO Aggregation & Dispatch Hub"
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={setActiveNav}
    >
      <div className="fpo-container">
        {/* Top Header bar with refresh */}
        <div className="fpo-header-row">
          <div>
            <h1 className="fpo-section-title">
              {activeNav === 'overview' && 'Central Aggregation & Hub Overview'}
              {activeNav === 'review' && 'Produce Quality & Price Review'}
              {activeNav === 'orders' && 'Marketplace Orders Ledger'}
              {activeNav === 'dispatch' && 'Smart Route Dispatch & Clustering'}
              {activeNav === 'reports' && 'Fulfillment Performance & Analytics'}
            </h1>
            <p className="fpo-section-sub">
              {activeNav === 'overview' && 'Real-time overview of incoming farm lots, order queues, and transport routes.'}
              {activeNav === 'review' && 'Verify AI quality grading, Mandi market rates, and approve produce for sale.'}
              {activeNav === 'orders' && 'Full visibility of customer orders, item allocations, and fulfillment statuses.'}
              {activeNav === 'dispatch' && 'Cluster deliveries within vehicle capacity limits and optimize turn-by-turn road paths.'}
              {activeNav === 'reports' && 'Cumulative statistics on produce handled, revenue settled, and fleet travel.'}
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="fpo-btn fpo-btn-outline"
            title="Refresh database records"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Sync Hub Data'}</span>
          </button>
        </div>

        {/* Global Messages */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: 'var(--color-danger)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: 'var(--color-accent)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner text="Connecting to TraceCrop Central Ledger..." />
        ) : (
          <>
            {/* 1. OVERVIEW VIEW */}
            {activeNav === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="fpo-stats-grid">
                  <div className="fpo-stat-card">
                    <div className="fpo-stat-icon-wrap">
                      <CheckSquare size={22} />
                    </div>
                    <div className="fpo-stat-info">
                      <span className="fpo-stat-label">Pending Review</span>
                      <span className="fpo-stat-value">{stats.pendingProduceCount}</span>
                      <span className="fpo-stat-subtext">Lots awaiting gate check</span>
                    </div>
                  </div>

                  <div className="fpo-stat-card">
                    <div className="fpo-stat-icon-wrap">
                      <Layers size={22} />
                    </div>
                    <div className="fpo-stat-info">
                      <span className="fpo-stat-label">Active Inventory</span>
                      <span className="fpo-stat-value">{stats.activeProduceCount}</span>
                      <span className="fpo-stat-subtext">Marketplace approved</span>
                    </div>
                  </div>

                  <div className="fpo-stat-card">
                    <div className="fpo-stat-icon-wrap">
                      <ShoppingBag size={22} />
                    </div>
                    <div className="fpo-stat-info">
                      <span className="fpo-stat-label">Open Orders</span>
                      <span className="fpo-stat-value">{stats.openOrdersCount}</span>
                      <span className="fpo-stat-subtext">Ready for grouping</span>
                    </div>
                  </div>

                  <div className="fpo-stat-card">
                    <div className="fpo-stat-icon-wrap">
                      <Truck size={22} />
                    </div>
                    <div className="fpo-stat-info">
                      <span className="fpo-stat-label">Delivery Groups</span>
                      <span className="fpo-stat-value">{stats.dispatchedGroupsCount}</span>
                      <span className="fpo-stat-subtext">Shipped & delivered</span>
                    </div>
                  </div>
                </div>

                {/* Quick pending section */}
                <div className="fpo-table-card">
                  <div
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--color-border-sage)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckSquare size={18} color="var(--color-primary)" />
                      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>
                        Recent Produce Submissions Requiring FPO Approval
                      </h2>
                    </div>
                    <button
                      className="fpo-btn fpo-btn-sm fpo-btn-outline"
                      onClick={() => setActiveNav('review')}
                    >
                      View All ({pendingListings.length})
                    </button>
                  </div>

                  {pendingListings.length === 0 ? (
                    <EmptyState
                      icon={CheckSquare}
                      title="All Produce Lots Verified"
                      message="No incoming farmer harvests are currently pending review."
                    />
                  ) : (
                    <div className="fpo-table-wrap">
                      <table className="fpo-table">
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>Produce</th>
                            <th>Farmer</th>
                            <th>Category</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>AI Grade</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingListings.slice(0, 5).map((item) => (
                            <tr key={item._id || item.id}>
                              <td>
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="fpo-thumb-img"
                                  onClick={() => setPreviewImage(item.imageUrl)}
                                  title="Click to view full photo"
                                />
                              </td>
                              <td>
                                <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{item.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                  Harvest: {item.harvestDate}
                                </div>
                              </td>
                              <td>{item.farmerName || 'Registered Farmer'}</td>
                              <td>{item.category}</td>
                              <td>{item.quantity} kg</td>
                              <td>Rs {item.price}/kg</td>
                              <td>
                                <StatusBadge status={item.aiGrade} type="grade" />
                              </td>
                              <td>
                                <div className="fpo-action-group">
                                  <button
                                    className="fpo-btn fpo-btn-sm fpo-btn-accent"
                                    onClick={() => handleApprove(item._id || item.id)}
                                  >
                                    <Check size={14} /> Approve
                                  </button>
                                  <button
                                    className="fpo-btn fpo-btn-sm fpo-btn-danger-outline"
                                    onClick={() => handleOpenRejectModal(item)}
                                  >
                                    <X size={14} /> Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Quick open orders section */}
                <div className="fpo-table-card">
                  <div
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--color-border-sage)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ShoppingBag size={18} color="var(--color-primary)" />
                      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>
                        Pending Orders Ready For Dispatch
                      </h2>
                    </div>
                    <button
                      className="fpo-btn fpo-btn-sm fpo-btn-outline"
                      onClick={() => setActiveNav('dispatch')}
                    >
                      Open Dispatch Planner ({placedOrders.length})
                    </button>
                  </div>

                  {placedOrders.length === 0 ? (
                    <EmptyState
                      icon={ShoppingBag}
                      title="No Unassigned Orders"
                      message="All customer orders have been grouped or dispatched."
                    />
                  ) : (
                    <div className="fpo-table-wrap">
                      <table className="fpo-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Address</th>
                            <th>Total Items</th>
                            <th>Order Value</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {placedOrders.slice(0, 5).map((o) => (
                            <tr key={o._id || o.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                #{String(o._id || o.id).slice(-6)}
                              </td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{o.customerName || 'Customer'}</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{o.customerPhone}</div>
                              </td>
                              <td>{o.deliveryAddress}</td>
                              <td>
                                {(o.items || []).reduce((sum, it) => sum + (it.qty || 0), 0)} kg (
                                {(o.items || []).length} items)
                              </td>
                              <td style={{ fontWeight: 700 }}>Rs {o.totalAmount}</td>
                              <td>
                                <StatusBadge status={o.status} type="order" />
                              </td>
                              <td>
                                <button
                                  className="fpo-btn fpo-btn-sm fpo-btn-outline"
                                  onClick={() => setSelectedOrderDetail(o)}
                                >
                                  <Eye size={14} /> Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. PRODUCE REVIEW VIEW */}
            {activeNav === 'review' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="fpo-toolbar">
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    Displaying <strong>{pendingListings.length}</strong> produce lot(s) awaiting verification.
                  </div>
                </div>

                <div className="fpo-table-card">
                  {pendingListings.length === 0 ? (
                    <EmptyState
                      icon={CheckSquare}
                      title="Review Queue Clear"
                      message="No produce listings currently require FPO verification."
                    />
                  ) : (
                    <div className="fpo-table-wrap">
                      <table className="fpo-table">
                        <thead>
                          <tr>
                            <th>Produce</th>
                            <th>Farmer</th>
                            <th>Category</th>
                            <th>Stock (kg)</th>
                            <th>Price & Benchmark</th>
                            <th>AI Quality Gate</th>
                            <th>Confidence</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingListings.map((item) => (
                            <tr key={item._id || item.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="fpo-thumb-img"
                                    onClick={() => setPreviewImage(item.imageUrl)}
                                    title="Click to view full photo"
                                  />
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{item.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                      Harvest: {item.harvestDate}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                      Location: {item.location}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>{item.farmerName || 'Farmer'}</td>
                              <td>{item.category}</td>
                              <td style={{ fontWeight: 600 }}>{item.quantity} kg</td>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Rs {item.price}/kg</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                  Mandi Rate: Rs {item.mandiRate || 'N/A'}/kg
                                </div>
                                {item.priceFlagged && (
                                  <div className="fpo-price-flag" style={{ marginTop: 4 }}>
                                    <AlertTriangle size={12} /> 50%+ Above Mandi
                                  </div>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <StatusBadge status={item.aiGrade} type="grade" />
                                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', maxWidth: 220 }}>
                                    {item.aiReason}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span style={{ fontSize: 12, fontWeight: 600 }}>
                                  {Math.round((item.aiConfidence || 0.85) * 100)}%
                                </span>
                                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                                  Via {item.aiSource === 'gemini' ? 'Gemini 3.8' : 'Vision Rule'}
                                </div>
                              </td>
                              <td>
                                <div className="fpo-action-group">
                                  <button
                                    className="fpo-btn fpo-btn-sm fpo-btn-accent"
                                    onClick={() => handleApprove(item._id || item.id)}
                                    title="Approve and release to customer marketplace"
                                  >
                                    <Check size={14} /> Approve
                                  </button>
                                  <button
                                    className="fpo-btn fpo-btn-sm fpo-btn-danger-outline"
                                    onClick={() => handleOpenRejectModal(item)}
                                    title="Reject produce with explicit audit reason"
                                  >
                                    <X size={14} /> Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. ORDERS VIEW */}
            {activeNav === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="fpo-toolbar">
                  <div className="fpo-filter-tabs">
                    {['all', 'placed', 'grouped', 'shipped', 'delivered'].map((st) => (
                      <button
                        key={st}
                        className={`fpo-tab-btn ${orderStatusFilter === st ? 'active' : ''}`}
                        onClick={() => setOrderStatusFilter(st)}
                      >
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="fpo-search-input"
                      placeholder="Search orders, customers, address..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="fpo-table-card">
                  {filteredOrders.length === 0 ? (
                    <EmptyState
                      icon={ShoppingBag}
                      title="No Orders Found"
                      message="No customer orders match the selected filter criteria."
                    />
                  ) : (
                    <div className="fpo-table-wrap">
                      <table className="fpo-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Items Summary</th>
                            <th>Total Weight</th>
                            <th>Total Amount</th>
                            <th>Delivery Address</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((o) => {
                            const totalKg = (o.items || []).reduce((sum, it) => sum + (it.qty || 0), 0);
                            return (
                              <tr key={o._id || o.id}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                  #{String(o._id || o.id).slice(-6)}
                                </td>
                                <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                  {new Date(o.createdAt).toLocaleDateString()}
                                </td>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{o.customerName || 'Customer'}</div>
                                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                    {o.customerPhone || 'N/A'}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontSize: 12, color: 'var(--color-text)' }}>
                                    {(o.items || []).map((it) => `${it.name} (${it.qty}kg)`).join(', ')}
                                  </div>
                                </td>
                                <td style={{ fontWeight: 600 }}>{totalKg} kg</td>
                                <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Rs {o.totalAmount}</td>
                                <td style={{ fontSize: 12, maxWidth: 200 }}>{o.deliveryAddress}</td>
                                <td>
                                  <StatusBadge status={o.status} type="order" />
                                </td>
                                <td>
                                  <button
                                    className="fpo-btn fpo-btn-sm fpo-btn-outline"
                                    onClick={() => setSelectedOrderDetail(o)}
                                  >
                                    <Eye size={14} /> View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. DISPATCH VIEW (SMART CLUSTERING & ROUTING) */}
            {activeNav === 'dispatch' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Active Shipped Groups Banner */}
                {deliveryGroups.filter((g) => g.status === 'shipped').length > 0 && (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Truck size={18} color="var(--color-accent)" />
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
                        Currently Dispatched In-Transit Groups
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      {deliveryGroups
                        .filter((g) => g.status === 'shipped')
                        .map((grp) => (
                          <div
                            key={grp._id || grp.id}
                            style={{
                              background: '#ffffff',
                              border: '1px solid var(--color-border-sage)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 16,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>
                                Group #{String(grp._id || grp.id).slice(-6)}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                {grp.orderIds?.length || 0} stops &bull; {grp.totalWeightKg} kg &bull;{' '}
                                {grp.totalDistanceKm} km
                              </div>
                            </div>
                            <button
                              className="fpo-btn fpo-btn-sm fpo-btn-accent"
                              onClick={() => handleMarkDelivered(grp._id || grp.id)}
                            >
                              <Check size={14} /> Mark Delivered
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="fpo-dispatch-grid">
                  {/* Left Column: Clustering Controls & Proposals */}
                  <div className="fpo-dispatch-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>
                        Smart Clustering Planner
                      </h2>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {placedOrders.length} placed order(s)
                      </span>
                    </div>

                    <div className="fpo-dispatch-controls">
                      <div className="fpo-control-field">
                        <label className="fpo-control-label">Max Proximity (km)</label>
                        <input
                          type="number"
                          className="fpo-control-input"
                          min="1"
                          max="50"
                          value={maxKm}
                          onChange={(e) => setMaxKm(Number(e.target.value))}
                        />
                      </div>
                      <div className="fpo-control-field">
                        <label className="fpo-control-label">Max Vehicle Load (kg)</label>
                        <input
                          type="number"
                          className="fpo-control-input"
                          min="10"
                          max="1000"
                          value={maxKg}
                          onChange={(e) => setMaxKg(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Order Selection Checklist */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
                          Select Orders to Dispatch
                        </span>
                        {placedOrders.length > 0 && (
                          <button
                            type="button"
                            onClick={toggleSelectAllOrders}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-accent)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {selectedOrderIds.length === placedOrders.length ? 'Deselect All' : 'Select All'}
                          </button>
                        )}
                      </div>

                      {placedOrders.length === 0 ? (
                        <div
                          style={{
                            padding: 16,
                            textAlign: 'center',
                            background: '#fbfdfa',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border-sage)',
                            fontSize: 12,
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          No placed orders available for grouping right now.
                        </div>
                      ) : (
                        <div className="fpo-orders-checklist">
                          {placedOrders.map((o) => {
                            const oId = String(o._id || o.id);
                            const isChecked = selectedOrderIds.includes(oId);
                            const totalWeight = (o.items || []).reduce((sum, it) => sum + (it.qty || 0), 0);
                            return (
                              <label key={oId} className="fpo-checklist-item" style={{ cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  className="fpo-checklist-checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleSelectOrder(oId)}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong style={{ color: 'var(--color-primary)' }}>
                                      {o.customerName || 'Customer'}
                                    </strong>
                                    <span>#{oId.slice(-6)}</span>
                                  </div>
                                  <div style={{ color: 'var(--color-text-muted)' }}>{o.deliveryAddress}</div>
                                  <div style={{ marginTop: 2, display: 'flex', gap: 10, fontSize: 11 }}>
                                    <span>Weight: {totalWeight} kg</span>
                                    <span>Value: Rs {o.totalAmount}</span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      className="fpo-btn fpo-btn-primary"
                      onClick={handleRunGrouping}
                      disabled={clustering || placedOrders.length === 0}
                      style={{ width: '100%', padding: '10px 16px' }}
                    >
                      <Navigation size={16} />
                      <span>{clustering ? 'Optimizing Routes...' : 'Group Automatically (OSRM / Haversine)'}</span>
                    </button>

                    {/* Proposed Groups Display */}
                    {proposedGroups.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
                          Proposed Dispatch Clusters ({proposedGroups.length})
                        </div>

                        {proposedGroups.map((group, idx) => {
                          const isSelected = selectedGroupIndex === idx;
                          return (
                            <div
                              key={idx}
                              className={`fpo-group-card ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedGroupIndex(idx)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="fpo-group-header">
                                <span className="fpo-group-title">Cluster Group #{idx + 1}</span>
                                <span className="fpo-route-badge">
                                  {group.source === 'osrm' ? 'OSRM Road Match' : 'Haversine Vector'}
                                </span>
                              </div>

                              <div className="fpo-metrics-row">
                                <div className="fpo-metric-box">
                                  <span className="fpo-metric-label">Stops</span>
                                  <span className="fpo-metric-val">{group.orders.length}</span>
                                </div>
                                <div className="fpo-metric-box">
                                  <span className="fpo-metric-label">Weight</span>
                                  <span className="fpo-metric-val">{group.totalWeightKg} kg</span>
                                </div>
                                <div className="fpo-metric-box">
                                  <span className="fpo-metric-label">Distance</span>
                                  <span className="fpo-metric-val">{group.totalDistanceKm} km</span>
                                </div>
                                <div className="fpo-metric-box">
                                  <span className="fpo-metric-label">Duration</span>
                                  <span className="fpo-metric-val">{group.totalDurationMin} min</span>
                                </div>
                              </div>

                              {/* Stop Sequence */}
                              <div className="fpo-stops-list">
                                <div className="fpo-stop-item">
                                  <span className="fpo-stop-num fpo-stop-hub-num">H</span>
                                  <span className="fpo-stop-text" style={{ fontWeight: 600 }}>
                                    Central FPO Hub (Origin)
                                  </span>
                                </div>
                                {group.orders.map((o, sIdx) => (
                                  <div key={o._id} className="fpo-stop-item">
                                    <span className="fpo-stop-num">{sIdx + 1}</span>
                                    <span className="fpo-stop-text">
                                      {o.customerName} &bull; {o.deliveryAddress} ({o.totalWeightKg} kg)
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <button
                                className="fpo-btn fpo-btn-accent"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConfirmGroup(group);
                                }}
                                disabled={confirmingGroup}
                                style={{ width: '100%', marginTop: 4 }}
                              >
                                <Truck size={16} />
                                <span>{confirmingGroup ? 'Confirming...' : 'Confirm and Ship Group'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Leaflet Map Preview */}
                  <div className="fpo-map-wrapper">
                    <div className="fpo-map-overlay-info">
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 2 }}>
                        {activeGroup ? `Viewing Cluster Route #${selectedGroupIndex + 1}` : 'FPO Hub & Open Stops'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {activeGroup
                          ? `${activeGroup.orders.length} stops &bull; ${activeGroup.totalDistanceKm} km &bull; ~${activeGroup.totalDurationMin} mins delivery loop`
                          : 'Select or generate a group to render full road polyline.'}
                      </div>
                    </div>

                    <MapContainer
                      center={fpoHubCoords}
                      zoom={12}
                      style={{ width: '100%', height: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      <MapBoundsUpdater bounds={mapBounds} center={fpoHubCoords} />

                      {/* FPO Hub Marker */}
                      <Marker position={fpoHubCoords} icon={hubIcon}>
                        <Popup>
                          <div style={{ padding: 4 }}>
                            <strong style={{ color: '#183d2b', fontSize: 13 }}>Sahyadri FPO Central Hub</strong>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#5e7764' }}>
                              Origin point for all cluster dispatches.
                            </p>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Active Group Stops */}
                      {activeGroup ? (
                        <>
                          {activeGroup.orders.map((o, idx) => (
                            <Marker
                              key={o._id}
                              position={[o.deliveryLat || 18.5204, o.deliveryLng || 73.8567]}
                              icon={createStopIcon(idx + 1)}
                            >
                              <Popup>
                                <div style={{ padding: 4 }}>
                                  <strong style={{ color: '#2e7d4f' }}>
                                    Stop {idx + 1}: {o.customerName}
                                  </strong>
                                  <p style={{ margin: '3px 0', fontSize: 11 }}>{o.deliveryAddress}</p>
                                  <p style={{ margin: 0, fontSize: 11, color: '#5e7764' }}>
                                    Weight: {o.totalWeightKg} kg | Amount: Rs {o.totalAmount}
                                  </p>
                                </div>
                              </Popup>
                            </Marker>
                          ))}

                          {/* Route Polyline */}
                          {mapPolylineCoords.length > 0 && (
                            <Polyline
                              positions={mapPolylineCoords}
                              pathOptions={{ color: '#183d2b', weight: 4, opacity: 0.85 }}
                            />
                          )}
                        </>
                      ) : (
                        /* Unassigned Placed Order Pins */
                        placedOrders.map((o) => (
                          <Marker
                            key={o._id || o.id}
                            position={[o.deliveryLat || 18.5204, o.deliveryLng || 73.8567]}
                            icon={defaultCustomerIcon}
                          >
                            <Popup>
                              <div style={{ padding: 4 }}>
                                <strong>{o.customerName}</strong>
                                <p style={{ margin: '2px 0', fontSize: 11 }}>{o.deliveryAddress}</p>
                                <p style={{ margin: 0, fontSize: 11, color: '#5e7764' }}>
                                  Value: Rs {o.totalAmount}
                                </p>
                              </div>
                            </Popup>
                          </Marker>
                        ))
                      )}
                    </MapContainer>
                  </div>
                </div>
              </div>
            )}

            {/* 5. REPORTS & FULFILLMENT ANALYTICS */}
            {activeNav === 'reports' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="fpo-stats-grid">
                  <div className="fpo-stat-card">
                    <div className="fpo-stat-icon-wrap">
                      <ShoppingBag size={22} />
                    </div>
                    <div className="fpo-stat-info">
                      <span className="fpo-stat-label">Delivered Orders</span>
                      <span className="fpo-stat-value">{stats.totalDeliveredOrders}</span>
                      <span className="fpo-stat-subtext">Completed consumer orders</span>
                    </div>
                  </div>

                  <div className="fpo-stat-card">
                    <div className="fpo-stat-icon-wrap">
                      <BarChart3 size={22} />
                    </div>
                    <div className="fpo-stat-info">
                      <span className="fpo-stat-label">Total Revenue</span>
                      <span className="fpo-stat-value">Rs {stats.totalRevenue.toLocaleString()}</span>
                      <span className="fpo-stat-subtext">Processed direct-to-farm</span>
                    </div>
                  </div>

                  <div className="fpo-stat-card">
                    <div className="fpo-stat-icon-wrap">
                      <Weight size={22} />
                    </div>
                    <div className="fpo-stat-info">
                      <span className="fpo-stat-label">Produce Handled</span>
                      <span className="fpo-stat-value">{stats.totalKgDispatched} kg</span>
                      <span className="fpo-stat-subtext">Aggregated through hub</span>
                    </div>
                  </div>

                  <div className="fpo-stat-card">
                    <div className="fpo-stat-icon-wrap">
                      <Truck size={22} />
                    </div>
                    <div className="fpo-stat-info">
                      <span className="fpo-stat-label">Fleet Runs</span>
                      <span className="fpo-stat-value">{deliveryGroups.length}</span>
                      <span className="fpo-stat-subtext">Total cluster routes</span>
                    </div>
                  </div>
                </div>

                {/* Audit table of all delivery groups */}
                <div className="fpo-table-card">
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border-sage)' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>
                      Dispatched Fleet Audit History
                    </h2>
                  </div>

                  {deliveryGroups.length === 0 ? (
                    <EmptyState
                      icon={Truck}
                      title="No Fleet Logs Available"
                      message="Confirm and dispatch your first delivery group to record logs."
                    />
                  ) : (
                    <div className="fpo-table-wrap">
                      <table className="fpo-table">
                        <thead>
                          <tr>
                            <th>Group ID</th>
                            <th>Created Date</th>
                            <th>Orders En Route</th>
                            <th>Total Weight</th>
                            <th>Distance</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deliveryGroups.map((grp) => (
                            <tr key={grp._id || grp.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                #{String(grp._id || grp.id).slice(-6)}
                              </td>
                              <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                {new Date(grp.createdAt).toLocaleString()}
                              </td>
                              <td>{grp.orderIds?.length || 0} customer orders</td>
                              <td style={{ fontWeight: 600 }}>{grp.totalWeightKg} kg</td>
                              <td>{grp.totalDistanceKm} km</td>
                              <td>{grp.totalDurationMin} min</td>
                              <td>
                                <StatusBadge status={grp.status} type="order" />
                              </td>
                              <td>
                                {grp.status === 'shipped' ? (
                                  <button
                                    className="fpo-btn fpo-btn-sm fpo-btn-accent"
                                    onClick={() => handleMarkDelivered(grp._id || grp.id)}
                                  >
                                    <Check size={14} /> Mark Delivered
                                  </button>
                                ) : (
                                  <span style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 600 }}>
                                    Completed
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* MODAL: Full produce image preview */}
        {previewImage && (
          <Modal isOpen={!!previewImage} title="Produce Visual Inspection" onClose={() => setPreviewImage(null)}>
            <img src={previewImage} alt="Inspection" className="fpo-full-preview-img" />
          </Modal>
        )}

        {/* MODAL: Reject Produce with Mandatory Reason */}
        {rejectModalListing && (
          <Modal
            isOpen={!!rejectModalListing}
            title={`Reject Produce Lot: ${rejectModalListing.name}`}
            onClose={() => setRejectModalListing(null)}
          >
            <form onSubmit={handleSubmitReject} className="fpo-modal-form">
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Please provide specific feedback for the farmer (e.g. quality defects, discoloration, excessive moisture,
                or unrealistic price spike). This will be recorded directly on their provenance ledger.
              </p>

              <div className="fpo-form-group">
                <label className="fpo-form-label">Mandatory Audit Reason</label>
                <textarea
                  className="fpo-textarea"
                  placeholder="Explain why this produce lot cannot be approved..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="fpo-btn fpo-btn-outline"
                  onClick={() => setRejectModalListing(null)}
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fpo-btn"
                  style={{ background: 'var(--color-danger)', color: '#ffffff' }}
                  disabled={submittingReview || !rejectionReason.trim()}
                >
                  {submittingReview ? 'Submitting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* MODAL: Order Detail Drawer */}
        {selectedOrderDetail && (
          <Modal
            isOpen={!!selectedOrderDetail}
            title={`Order Details #${String(selectedOrderDetail._id || selectedOrderDetail.id).slice(-6)}`}
            onClose={() => setSelectedOrderDetail(null)}
          >
            <div className="fpo-order-detail-grid">
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Customer Name</div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {selectedOrderDetail.customerName || 'Customer'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Phone Number</div>
                <div style={{ fontWeight: 600 }}>{selectedOrderDetail.customerPhone || 'N/A'}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Delivery Address</div>
                <div style={{ fontWeight: 600 }}>{selectedOrderDetail.deliveryAddress}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>GPS Coordinates</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {selectedOrderDetail.deliveryLat}, {selectedOrderDetail.deliveryLng}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Status</div>
                <div style={{ marginTop: 2 }}>
                  <StatusBadge status={selectedOrderDetail.status} type="order" />
                </div>
              </div>
            </div>

            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: 'var(--color-primary)' }}>
              Ordered Items
            </div>
            <table className="fpo-order-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price/kg</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(selectedOrderDetail.items || []).map((it, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{it.name}</td>
                    <td>{it.qty} kg</td>
                    <td>Rs {it.price}</td>
                    <td style={{ fontWeight: 700 }}>Rs {it.price * it.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px solid var(--color-border-sage)',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700 }}>Total Order Value:</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>
                Rs {selectedOrderDetail.totalAmount}
              </span>
            </div>
          </Modal>
        )}
      </div>
    </SidebarLayout>
  );
}
