import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SidebarLayout from '../../components/SidebarLayout';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../utils/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShoppingBag,
  ShoppingCart,
  Clock,
  Search,
  MapPin,
  Calendar,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Truck,
  ExternalLink,
  LocateFixed,
  Sprout,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CustomerDashboard.css';

// Custom Pin for Map picker to eliminate broken Leaflet PNG assets
const deliveryPinIcon = L.divIcon({
  className: 'custom-customer-pin',
  html: `<div style="background:#183D2B;color:#ffffff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.35);border:2px solid #ffffff;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Map click event listener component
function MapClickCapture({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Map center synchronizer
function MapCenterView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 13, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('marketplace');

  // Marketplace State
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quantities, setQuantities] = useState({});

  // Cart State
  const [cart, setCart] = useState([]);
  const [cartNotice, setCartNotice] = useState('');

  // Checkout State
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || 'Kothrud, Pune');
  const [deliveryCoords, setDeliveryCoords] = useState([
    user?.lat || 18.5074,
    user?.lng || 73.8077,
  ]);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Quick delivery location presets for Pune region
  const locationPresets = [
    { label: 'Kothrud', lat: 18.5074, lng: 73.8077, address: 'Kothrud, Pune' },
    { label: 'Shivajinagar', lat: 18.5314, lng: 73.8446, address: 'Shivajinagar, Pune' },
    { label: 'Hadapsar', lat: 18.5089, lng: 73.926, address: 'Hadapsar, Pune' },
    { label: 'Viman Nagar', lat: 18.5679, lng: 73.9143, address: 'Viman Nagar, Pune' },
    { label: 'Hinjewadi', lat: 18.5913, lng: 73.7389, address: 'Hinjewadi Phase 1, Pune' },
  ];

  // Fetch marketplace listings
  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const res = await api.get('/listings');
      if (res.data?.success) {
        setListings(res.data.listings || []);
      }
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoadingListings(false);
    }
  };

  // Fetch customer orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders/mine');
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchListings();
    fetchOrders();
  }, []);

  // Update quantity selector in produce cards
  const handleQtyChange = (listingId, delta, maxStock) => {
    setQuantities((prev) => {
      const current = prev[listingId] || 1;
      const next = Math.max(1, Math.min(current + delta, maxStock));
      return { ...prev, [listingId]: next };
    });
  };

  // Add produce item to cart
  const addToCart = (listing) => {
    const qty = quantities[listing._id || listing.id] || 1;
    const listingId = listing._id || listing.id;

    setCart((prev) => {
      const existing = prev.find((item) => item.listingId === listingId);
      if (existing) {
        const updatedQty = Math.min(existing.qty + qty, listing.quantity);
        return prev.map((item) =>
          item.listingId === listingId ? { ...item, qty: updatedQty } : item
        );
      } else {
        return [
          ...prev,
          {
            listingId,
            name: listing.name,
            category: listing.category,
            price: listing.price,
            qty,
            maxStock: listing.quantity,
            farmerName: listing.farmerName || 'Cooperative Member',
            location: listing.location,
            imageUrl: listing.imageUrl,
          },
        ];
      }
    });

    setCartNotice(`Added ${qty} kg of ${listing.name} to cart.`);
    setTimeout(() => setCartNotice(''), 3000);
  };

  // Update item quantity inside cart
  const updateCartItemQty = (listingId, newQty) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.listingId !== listingId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.listingId === listingId
            ? { ...item, qty: Math.min(newQty, item.maxStock) }
            : item
        )
      );
    }
  };

  // Remove single item from cart
  const removeCartItem = (listingId) => {
    setCart((prev) => prev.filter((item) => item.listingId !== listingId));
  };

  // Calculate cart subtotal
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Capture user's current GPS location
  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDeliveryCoords([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          setOrderError('Unable to retrieve device GPS. Please pinpoint your location on the map.');
        }
      );
    }
  };

  // Submit order to backend
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!deliveryAddress.trim()) {
      setOrderError('Please enter a delivery address.');
      return;
    }

    setSubmittingOrder(true);
    setOrderError('');

    try {
      const payload = {
        items: cart.map((item) => ({
          listingId: item.listingId,
          qty: item.qty,
        })),
        deliveryAddress,
        deliveryLat: deliveryCoords[0],
        deliveryLng: deliveryCoords[1],
      };

      const res = await api.post('/orders', payload);
      if (res.data?.success) {
        setCart([]);
        await fetchOrders();
        await fetchListings();
        setActiveNav('orders');
      } else {
        setOrderError(res.data?.message || 'Failed to place order.');
      }
    } catch (err) {
      setOrderError(err.message || 'Stock reservation failed. Some items may be sold out.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Filter listings by search query and category
  const filteredListings = listings.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.farmerName && item.farmerName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sidebar navigation items
  const totalCartUnits = cart.reduce((sum, item) => sum + item.qty, 0);
  const navItems = [
    { id: 'marketplace', label: 'Browse Produce', icon: ShoppingBag },
    {
      id: 'cart',
      label: totalCartUnits > 0 ? `Cart & Checkout (${totalCartUnits})` : 'Cart & Checkout',
      icon: ShoppingCart,
    },
    { id: 'orders', label: 'My Orders', icon: Clock },
  ];

  return (
    <SidebarLayout
      title="Fresh Produce Marketplace"
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={setActiveNav}
    >
      <div className="customer-container">
        {cartNotice && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-surface-sage)',
              border: '1px solid var(--color-border-sage)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle size={16} strokeWidth={1.75} />
            <span>{cartNotice}</span>
          </div>
        )}

        {/* TAB 1: BROWSE PRODUCE MARKETPLACE */}
        {activeNav === 'marketplace' && (
          <section className="marketplace-section">
            <div className="market-header">
              <div className="market-search-box">
                <Search size={18} strokeWidth={1.75} className="market-search-icon" />
                <input
                  type="text"
                  placeholder="Search fresh crop, farmer, or region..."
                  className="market-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="market-filters">
                {['All', 'Vegetables', 'Fruits', 'Other'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loadingListings ? (
              <LoadingSpinner message="Loading cooperative produce listings..." />
            ) : filteredListings.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title="No produce listings found"
                description="No approved produce batches currently match your filter criteria. Check back shortly as farmers harvest fresh stock."
              />
            ) : (
              <div className="produce-grid">
                {filteredListings.map((listing) => {
                  const id = listing._id || listing.id;
                  const selectedQty = quantities[id] || 1;
                  const isAvailable = listing.quantity > 0;

                  return (
                    <article key={id} className="produce-card">
                      <div className="produce-card-image-wrap">
                        {listing.imageUrl ? (
                          <img
                            src={listing.imageUrl}
                            alt={listing.name}
                            className="produce-card-img"
                          />
                        ) : (
                          <div className="produce-card-placeholder">
                            <Sprout size={32} strokeWidth={1.75} />
                            <span>{listing.category}</span>
                          </div>
                        )}

                        <div className="produce-card-badges">
                          <span className="category-tag">{listing.category}</span>
                          <span className="grade-badge">
                            <Sparkles size={12} strokeWidth={1.75} />
                            <span>Grade {listing.aiGrade || 'A'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="produce-card-content">
                        <div className="produce-card-header">
                          <h3 className="produce-card-title">{listing.name}</h3>
                          <div className="produce-card-meta">
                            <div className="produce-card-meta-row">
                              <MapPin size={13} strokeWidth={1.75} />
                              <span>{listing.location || 'Rural Region'}</span>
                            </div>
                            <div className="produce-card-meta-row">
                              <Calendar size={13} strokeWidth={1.75} />
                              <span>
                                Harvested:{' '}
                                {listing.harvestDate
                                  ? new Date(listing.harvestDate).toLocaleDateString()
                                  : 'Recent'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="produce-pricing-box">
                          <div>
                            <span className="price-main">₹{listing.price}</span>
                            <span className="price-unit"> / kg</span>
                          </div>
                          <div className="price-benchmark">
                            <div>Mandi Benchmark</div>
                            <div className="price-benchmark-value">
                              ₹{listing.mandiRate || listing.price} / kg
                            </div>
                          </div>
                        </div>

                        <div className="produce-stock-row">
                          <span className="text-muted">Available Stock:</span>
                          <span
                            className={`stock-tag ${
                              listing.quantity <= 20 ? 'low' : ''
                            }`}
                          >
                            {listing.quantity} kg remaining
                          </span>
                        </div>

                        <div className="produce-card-actions">
                          <div className="cart-qty-row">
                            <div className="qty-stepper">
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() =>
                                  handleQtyChange(id, -1, listing.quantity)
                                }
                                disabled={selectedQty <= 1 || !isAvailable}
                                aria-label="Decrease quantity"
                              >
                                <Minus size={14} strokeWidth={1.75} />
                              </button>
                              <input
                                type="text"
                                readOnly
                                value={selectedQty}
                                className="qty-input"
                              />
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() =>
                                  handleQtyChange(id, 1, listing.quantity)
                                }
                                disabled={
                                  selectedQty >= listing.quantity || !isAvailable
                                }
                                aria-label="Increase quantity"
                              >
                                <Plus size={14} strokeWidth={1.75} />
                              </button>
                            </div>

                            <button
                              type="button"
                              className="add-cart-btn"
                              onClick={() => addToCart(listing)}
                              disabled={!isAvailable}
                            >
                              <ShoppingCart size={15} strokeWidth={1.75} />
                              <span>{isAvailable ? 'Add to Cart' : 'Sold Out'}</span>
                            </button>
                          </div>

                          <Link
                            to={`/trace/${id}`}
                            className="trace-link-btn"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ShieldCheck size={14} strokeWidth={1.75} />
                            <span>Inspect Provenance Trace</span>
                            <ExternalLink size={12} strokeWidth={1.75} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: CART & CHECKOUT */}
        {activeNav === 'cart' && (
          <section className="cart-section">
            {cart.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Your cart is currently empty"
                description="Browse our verified regional produce listings and select fresh items directly from local farmers."
                action={
                  <button
                    type="button"
                    className="filter-btn active"
                    style={{ marginTop: 12 }}
                    onClick={() => setActiveNav('marketplace')}
                  >
                    Browse Produce
                  </button>
                }
              />
            ) : (
              <div className="cart-layout">
                {/* Cart Items List */}
                <div className="cart-items-panel">
                  <h2 className="panel-title">
                    <ShoppingCart size={18} strokeWidth={1.75} />
                    <span>Cart Items ({cart.length})</span>
                  </h2>

                  <div className="cart-items-list">
                    {cart.map((item) => (
                      <div key={item.listingId} className="cart-item-row">
                        <div className="cart-item-info">
                          <div className="cart-item-name">{item.name}</div>
                          <div className="cart-item-meta">
                            {item.category} • {item.farmerName} ({item.location})
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--color-primary)',
                              marginTop: 2,
                            }}
                          >
                            ₹{item.price} / kg
                          </div>
                        </div>

                        <div className="qty-stepper" style={{ height: 32 }}>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() =>
                              updateCartItemQty(item.listingId, item.qty - 1)
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus size={13} strokeWidth={1.75} />
                          </button>
                          <span
                            style={{
                              padding: '0 10px',
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {item.qty} kg
                          </span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() =>
                              updateCartItemQty(item.listingId, item.qty + 1)
                            }
                            disabled={item.qty >= item.maxStock}
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} strokeWidth={1.75} />
                          </button>
                        </div>

                        <div className="cart-item-price">
                          ₹{item.price * item.qty}
                        </div>

                        <button
                          type="button"
                          className="cart-remove-btn"
                          onClick={() => removeCartItem(item.listingId)}
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} strokeWidth={1.75} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checkout & Delivery Coordinates Form */}
                <div className="checkout-panel">
                  <h2 className="panel-title">
                    <Truck size={18} strokeWidth={1.75} />
                    <span>Delivery & Settlement</span>
                  </h2>

                  {orderError && (
                    <div
                      style={{
                        padding: 12,
                        backgroundColor: '#fdf2f2',
                        border: '1px solid #f8b4b4',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-danger)',
                        fontSize: 13,
                        lineHeight: 1.4,
                      }}
                    >
                      {orderError}
                    </div>
                  )}

                  <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          marginBottom: 6,
                          textTransform: 'uppercase',
                        }}
                      >
                        Delivery Street Address
                      </label>
                      <input
                        type="text"
                        required
                        className="market-search-input"
                        style={{ paddingLeft: 12, height: 38 }}
                        placeholder="House / Flat No., Society, Road..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                        }}
                      >
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Delivery Pinpoint GPS
                        </label>
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-accent)',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <LocateFixed size={12} strokeWidth={1.75} />
                          <span>Use Device GPS</span>
                        </button>
                      </div>

                      <div className="location-quick-buttons">
                        {locationPresets.map((loc) => (
                          <button
                            key={loc.label}
                            type="button"
                            className="quick-loc-btn"
                            onClick={() => {
                              setDeliveryCoords([loc.lat, loc.lng]);
                              setDeliveryAddress(loc.address);
                            }}
                          >
                            {loc.label}
                          </button>
                        ))}
                      </div>

                      <div className="checkout-map-container">
                        <MapContainer
                          center={deliveryCoords}
                          zoom={13}
                          style={{ width: '100%', height: '100%' }}
                          scrollWheelZoom={false}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={deliveryCoords} icon={deliveryPinIcon} />
                          <MapClickCapture
                            onSelect={(lat, lng) => setDeliveryCoords([lat, lng])}
                          />
                          <MapCenterView center={deliveryCoords} />
                        </MapContainer>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-muted)',
                          marginTop: 4,
                        }}
                      >
                        Coordinates: {deliveryCoords[0].toFixed(4)},{' '}
                        {deliveryCoords[1].toFixed(4)} (Click map to adjust pin)
                      </div>
                    </div>

                    <div className="order-summary-box">
                      <div className="summary-row">
                        <span>Items Subtotal</span>
                        <span>₹{cartSubtotal}</span>
                      </div>
                      <div className="summary-row">
                        <span>Cooperative Consolidated Delivery</span>
                        <span className="summary-free">FREE</span>
                      </div>
                      <div className="summary-row total">
                        <span>Total Payable</span>
                        <span>₹{cartSubtotal}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingOrder}
                      className="btn-primary-block"
                    >
                      {submittingOrder ? (
                        <span>Processing Order...</span>
                      ) : (
                        <>
                          <CheckCircle size={16} strokeWidth={1.75} />
                          <span>Confirm & Place Order (₹{cartSubtotal})</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: MY ORDERS & BATCH TRACEABILITY */}
        {activeNav === 'orders' && (
          <section className="orders-section">
            {loadingOrders ? (
              <LoadingSpinner message="Retrieving order history and batch status..." />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No orders placed yet"
                description="You haven't ordered produce yet. Check out the marketplace to buy direct from local farmers."
                action={
                  <button
                    type="button"
                    className="filter-btn active"
                    style={{ marginTop: 12 }}
                    onClick={() => setActiveNav('marketplace')}
                  >
                    Go to Marketplace
                  </button>
                }
              />
            ) : (
              <div className="orders-list">
                {orders.map((order) => {
                  const orderId = order._id || order.id;
                  const orderCode = `ORD-${orderId.slice(-6).toUpperCase()}`;
                  const createdDate = order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : 'Recently';

                  // Lifecycle progress logic
                  const stages = ['placed', 'grouped', 'shipped', 'delivered'];
                  const currentIdx = stages.indexOf(order.status || 'placed');

                  return (
                    <article key={orderId} className="order-card">
                      <div className="order-card-header">
                        <div className="order-card-id-block">
                          <h3 className="order-card-title">{orderCode}</h3>
                          <div className="order-card-date">Placed on {createdDate}</div>
                        </div>

                        <StatusBadge status={order.status || 'placed'} />
                      </div>

                      {/* 4-Step Lifecycle Status Tracker */}
                      <div className="lifecycle-tracker">
                        <div className="lifecycle-track-line">
                          <div
                            className="lifecycle-track-progress"
                            style={{
                              width: `${(Math.max(0, currentIdx) / (stages.length - 1)) * 100}%`,
                            }}
                          />
                        </div>

                        {stages.map((stage, idx) => {
                          const isDone = idx < currentIdx;
                          const isActive = idx === currentIdx;

                          return (
                            <div
                              key={stage}
                              className={`lifecycle-step ${
                                isDone ? 'completed' : isActive ? 'active' : ''
                              }`}
                            >
                              <div className="step-circle">
                                {isDone ? (
                                  <CheckCircle size={14} strokeWidth={2} />
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              <span className="step-label">{stage}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order items and provenance cards */}
                      <div className="order-items-grid">
                        <div>
                          <table className="order-items-table">
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th style={{ textAlign: 'center' }}>Qty</th>
                                <th style={{ textAlign: 'right' }}>Rate</th>
                                <th style={{ textAlign: 'right' }}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items?.map((item, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                                  <td style={{ textAlign: 'center' }}>{item.qty} kg</td>
                                  <td style={{ textAlign: 'right' }}>₹{item.price}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                    ₹{item.qty * item.price}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--color-text-muted)',
                              marginTop: 12,
                            }}
                          >
                            Destination: {order.deliveryAddress}
                          </div>

                          <div className="order-total-bar">
                            <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                              Total Paid
                            </span>
                            <span className="order-total-amount">
                              ₹{order.totalAmount}
                            </span>
                          </div>
                        </div>

                        {/* Provenance QR code for first item */}
                        {order.items?.[0] && (
                          <div className="order-qr-box">
                            <div className="order-qr-title">
                              Direct Farm Traceability
                            </div>
                            <QRCodeSVG
                              value={`${window.location.origin}/trace/${order.items[0].listingId}`}
                              size={110}
                              level="M"
                            />
                            <p className="order-qr-caption">
                              Scan this QR on delivery or click below to verify farm provenance,
                              harvest timing, and AI grading certificate.
                            </p>
                            <Link
                              to={`/trace/${order.items[0].listingId}`}
                              className="filter-btn"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                textDecoration: 'none',
                                fontSize: 12,
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span>View Provenance</span>
                              <ExternalLink size={13} strokeWidth={1.75} />
                            </Link>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </SidebarLayout>
  );
}
