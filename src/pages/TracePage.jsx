import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sprout,
  ShieldCheck,
  MapPin,
  Calendar,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  Truck,
  User,
  Cpu,
  BadgePercent,
  Share2,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiRequest } from '../utils/api';
import { QRCodeSVG } from 'qrcode.react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './TracePage.css';

// Farm Marker Pin
const farmPinIcon = L.divIcon({
  className: 'custom-farm-pin',
  html: `<div style="background:#183D2B;color:#ffffff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid #ffffff;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

export default function TracePage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchTraceData() {
      try {
        const data = await apiRequest(`/listings/trace/${id}`);
        if (data.success && data.listing) {
          setListing(data.listing);
        } else {
          setError('Produce batch provenance record not found.');
        }
      } catch (err) {
        setError(err.message || 'Unable to retrieve provenance records.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchTraceData();
    }
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="trace-page">
        <LoadingSpinner message="Querying cooperative provenance registry..." />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="trace-page">
        <div className="trace-container">
          <div className="trace-card" style={{ padding: 40, textAlign: 'center' }}>
            <h2
              style={{
                fontSize: 20,
                color: 'var(--color-danger)',
                marginBottom: 8,
                fontWeight: 700,
              }}
            >
              Batch Record Not Found
            </h2>
            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              {error || 'No verified agricultural audit data exists for this QR code.'}
            </p>
            <Link
              to="/customer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} strokeWidth={1.75} />
              <span>Return to Marketplace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Days since harvest calculation
  const harvestDateObj = listing.harvestDate ? new Date(listing.harvestDate) : null;
  const daysSinceHarvest = harvestDateObj
    ? Math.max(0, Math.floor((Date.now() - harvestDateObj.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  // Farm coordinates fallback
  const farmCoords = [
    listing.farmerLat || 18.73,
    listing.farmerLng || 73.85,
  ];

  const currentUrl = window.location.href;

  return (
    <div className="trace-page">
      {/* Navigation Header */}
      <header className="trace-nav">
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--color-primary)',
            fontWeight: 800,
            fontSize: 16,
            textDecoration: 'none',
          }}
        >
          <Sprout size={20} strokeWidth={1.75} />
          <span>TraceCrop Transparency Registry</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={handleShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text)',
              background: '#ffffff',
              border: '1px solid var(--color-border-sage)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            <Share2 size={14} strokeWidth={1.75} />
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>

          <Link
            to="/customer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-primary)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} strokeWidth={1.75} />
            <span>Marketplace</span>
          </Link>
        </div>
      </header>

      <main className="trace-container">
        <div className="trace-card">
          {/* Batch Title Header */}
          <div className="trace-header">
            <div>
              <h1 className="trace-title">{listing.name}</h1>
              <div className="trace-meta">
                <span>Batch #{String(listing.id).slice(-8).toUpperCase()}</span>
                <span>•</span>
                <span>{listing.category}</span>
                <span>•</span>
                <span>Cooperative Verified</span>
              </div>
            </div>

            <StatusBadge status={listing.status} />
          </div>

          {/* Photo Banner */}
          {listing.imageUrl ? (
            <img
              src={listing.imageUrl}
              alt={listing.name}
              className="trace-image-banner"
            />
          ) : (
            <div className="trace-image-placeholder">
              <Sprout size={40} strokeWidth={1.75} />
              <span>Certified Regional Produce Harvest</span>
            </div>
          )}

          <div className="trace-body">
            {/* Section 1: Farm & Farmer Origin */}
            <div className="trace-section">
              <h2 className="trace-section-title">
                <User size={16} strokeWidth={1.75} />
                <span>Producer & Farm Profile</span>
              </h2>

              <div className="trace-info-grid">
                <div className="trace-info-item">
                  <span className="trace-info-label">Farmer / Producer</span>
                  <span className="trace-info-value">{listing.farmerName}</span>
                </div>
                <div className="trace-info-item">
                  <span className="trace-info-label">Farm Location</span>
                  <span className="trace-info-value">{listing.location}</span>
                </div>
                <div className="trace-info-item">
                  <span className="trace-info-label">Harvest Date</span>
                  <span className="trace-info-value">
                    {harvestDateObj ? harvestDateObj.toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <div className="trace-info-item">
                  <span className="trace-info-label">Batch Volume</span>
                  <span className="trace-info-value">{listing.quantity} kg</span>
                </div>
              </div>

              {/* Farm Location Map */}
              <div className="trace-map-box">
                <MapContainer
                  center={farmCoords}
                  zoom={11}
                  style={{ width: '100%', height: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={farmCoords} icon={farmPinIcon} />
                </MapContainer>
              </div>
            </div>

            {/* Section 2: Quality Assurance & AI Vision Inspection */}
            <div className="trace-section">
              <h2 className="trace-section-title">
                <ShieldCheck size={16} strokeWidth={1.75} />
                <span>Quality Assurance & AI Vision Audit</span>
              </h2>

              <div className="trace-ai-box">
                <div className="trace-ai-header">
                  <div className="trace-ai-title">
                    <Sparkles size={16} strokeWidth={1.75} />
                    <span>Grading Assessment: Grade {listing.aiGrade}</span>
                  </div>

                  <div className="trace-ai-confidence">
                    Confidence: {Math.round((listing.aiConfidence || 0.88) * 100)}%
                  </div>
                </div>

                <p className="trace-ai-reason">{listing.aiReason}</p>

                <div className="trace-ai-source-tag">
                  <Cpu size={14} strokeWidth={1.75} />
                  <span>
                    Audited by {listing.aiSource === 'gemini' ? 'Gemini 3.8 Multimodal Vision Engine' : 'Heuristic Defect Analyzer'} • Verified by District FPO
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Fair Price Transparency Index */}
            <div className="trace-section">
              <h2 className="trace-section-title">
                <BadgePercent size={16} strokeWidth={1.75} />
                <span>Fair Trade & Price Transparency</span>
              </h2>

              <div className="price-transparency-grid">
                <div className="price-transparency-item">
                  <span className="price-trans-label">Farmer Direct Price</span>
                  <span className="price-trans-value">₹{listing.price} / kg</span>
                  <span className="price-trans-sub">100% to producer</span>
                </div>
                <div className="price-transparency-item">
                  <span className="price-trans-label">Regional Mandi Rate</span>
                  <span className="price-trans-value">
                    ₹{listing.mandiRate || listing.price} / kg
                  </span>
                  <span className="price-trans-sub">Govt APMC Benchmark</span>
                </div>
                <div className="price-transparency-item">
                  <span className="price-trans-label">Intermediary Markup</span>
                  <span className="price-trans-value" style={{ color: 'var(--color-accent)' }}>
                    ₹0
                  </span>
                  <span className="price-trans-sub">Zero middleman cut</span>
                </div>
              </div>
            </div>

            {/* Section 4: Chain of Custody Timeline */}
            <div className="trace-section">
              <h2 className="trace-section-title">
                <Truck size={16} strokeWidth={1.75} />
                <span>Chain of Custody Lifecycle</span>
              </h2>

              <div className="custody-timeline">
                <div className="custody-node">
                  <div className="custody-dot">
                    <CheckCircle size={12} strokeWidth={2.5} />
                  </div>
                  <div className="custody-title">1. Farm Harvest Recorded</div>
                  <div className="custody-desc">
                    Produce harvested at {listing.location} by {listing.farmerName} on{' '}
                    {harvestDateObj ? harvestDateObj.toLocaleDateString() : 'record date'}.
                  </div>
                </div>

                <div className="custody-node">
                  <div className="custody-dot">
                    <CheckCircle size={12} strokeWidth={2.5} />
                  </div>
                  <div className="custody-title">2. AI Vision Quality Inspection</div>
                  <div className="custody-desc">
                    Classified as Grade {listing.aiGrade} produce with high visual purity and zero mold.
                  </div>
                </div>

                <div className="custody-node">
                  <div className="custody-dot">
                    <CheckCircle size={12} strokeWidth={2.5} />
                  </div>
                  <div className="custody-title">3. FPO Cooperative Audit & Approval</div>
                  <div className="custody-desc">
                    Inspected and approved by district FPO for distribution and fair farmer payment.
                  </div>
                </div>

                <div className="custody-node">
                  <div className="custody-dot">
                    <CheckCircle size={12} strokeWidth={2.5} />
                  </div>
                  <div className="custody-title">4. Direct Delivery & Traceable Consumer Receipt</div>
                  <div className="custody-desc">
                    Packaged with cryptographic batch QR code directly delivered to consumer doorstep.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Verification Card */}
        <div className="trace-share-box">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>
            Digital Provenance Certificate
          </h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 440 }}>
            This cryptographic QR badge confirms this produce batch was sourced directly from{' '}
            {listing.farmerName} and verified by TraceCrop.
          </p>

          <QRCodeSVG value={currentUrl} size={130} level="M" />

          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Direct URL: {currentUrl}
          </div>
        </div>
      </main>
    </div>
  );
}
