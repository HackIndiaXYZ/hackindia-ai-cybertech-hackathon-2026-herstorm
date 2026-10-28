import React, { useState, useEffect, useRef } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import { parseVoiceInput } from '../../utils/speechParser';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  TrendingUp,
  Sparkles,
  Mic,
  MicOff,
  AlertTriangle,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Search,
  ArrowRight,
  Info,
} from 'lucide-react';
import './FarmerDashboard.css';

const SAMPLE_PHOTOS = [
  { label: 'Tomatoes (Grade A)', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80', crop: 'Tomato', cat: 'Vegetables' },
  { label: 'Spinach (Grade A)', url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80', crop: 'Spinach', cat: 'Vegetables' },
  { label: 'Grapes (Grade A)', url: 'https://images.unsplash.com/photo-1596363505729-4190a9506133?w=600&auto=format&fit=crop&q=80', crop: 'Grapes', cat: 'Fruits' },
  { label: 'Onions (Batch B)', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80', crop: 'Onion', cat: 'Vegetables' },
  { label: 'Overripe Bananas (Grade C)', url: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80', crop: 'Banana', cat: 'Fruits' },
];

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('overview');

  // Overview stats & listings
  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingFilter, setListingFilter] = useState('all');

  // Form states
  const [cropName, setCropName] = useState('');
  const [category, setCategory] = useState('Vegetables');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState(user?.address || 'Wadgaon Village, Pune');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Pricing advice state
  const [pricingAdvice, setPricingAdvice] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  // Mandi rate benchmarks
  const [mandiRates, setMandiRates] = useState([]);
  const [mandiSearch, setMandiSearch] = useState('');
  const [loadingMandi, setLoadingMandi] = useState(false);

  // AI suggestions
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // AI Grading outcome modal
  const [gradingModalData, setGradingModalData] = useState(null);

  // Deletion modal
  const [deleteListingTarget, setDeleteListingTarget] = useState(null);

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'add', label: 'Add Produce', icon: PlusCircle },
    { id: 'listings', label: 'My Listings', icon: Package },
    { id: 'pricing', label: 'Price Insights', icon: TrendingUp },
    { id: 'suggestions', label: 'Suggestions', icon: Sparkles },
  ];

  // Load farmer listings
  const fetchMyListings = async () => {
    setLoadingListings(true);
    try {
      const data = await apiRequest('/listings/mine');
      if (data.success) {
        setMyListings(data.listings || []);
      }
    } catch (err) {
      console.warn('Failed to load listings:', err.message);
    } finally {
      setLoadingListings(false);
    }
  };

  // Load mandi rates for autocomplete and price insights
  const fetchMandiRates = async () => {
    setLoadingMandi(true);
    try {
      const data = await apiRequest('/pricing/all');
      if (data.success) {
        setMandiRates(data.rates || []);
      }
    } catch (err) {
      console.warn('Failed to load mandi rates:', err.message);
    } finally {
      setLoadingMandi(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
    fetchMandiRates();
  }, []);

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = voiceLang;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      const parsed = parseVoiceInput(transcript);

      if (parsed.name) {
        setCropName(parsed.name);
        handleCropSelection(parsed.name, parsed.price || price);
      }
      if (parsed.quantity) setQuantity(parsed.quantity);
      if (parsed.price) setPrice(parsed.price);
      setIsListening(false);
    };

    recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [voiceLang, price]);

  const toggleVoiceRecording = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setVoiceTranscript('');
      recognitionRef.current.lang = voiceLang;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Mic start error:', err);
      }
    }
  };

  // Fetch real-time pricing advice whenever crop or price changes
  const handleCropSelection = async (crop, userEnteredPrice) => {
    if (!crop || !crop.trim()) {
      setPricingAdvice(null);
      return;
    }

    setLoadingPricing(true);
    try {
      const p = userEnteredPrice ? parseFloat(userEnteredPrice) : undefined;
      const query = `/pricing?crop=${encodeURIComponent(crop)}${p ? `&price=${p}` : ''}`;
      const data = await apiRequest(query);
      if (data.success) {
        setPricingAdvice(data);
      }
    } catch (err) {
      console.warn('Pricing lookup failed:', err.message);
    } finally {
      setLoadingPricing(false);
    }
  };

  // Price field change with real-time audit warning calculation
  const handlePriceChange = (val) => {
    setPrice(val);
    if (pricingAdvice) {
      const numVal = parseFloat(val);
      const hasWarning = !isNaN(numVal) && numVal > pricingAdvice.warnAbove;
      setPricingAdvice((prev) => ({
        ...prev,
        warning: hasWarning,
        warningMessage: hasWarning
          ? `Price Rs ${numVal}/kg exceeds 1.5x mandi benchmark (Rs ${prev.warnAbove}/kg). This listing will be flagged for FPO price audit.`
          : undefined,
      }));
    }
  };

  const handleUseSuggestedPrice = () => {
    if (pricingAdvice?.suggested) {
      setPrice(String(pricingAdvice.suggested));
      setPricingAdvice((prev) => ({
        ...prev,
        warning: false,
        warningMessage: undefined,
      }));
    }
  };

  // Handle sample photo selection for testing
  const handleSelectSamplePhoto = (sample) => {
    setImagePreviewUrl(sample.url);
    setSelectedImageFile(null);
    if (!cropName) {
      setCropName(sample.crop);
      setCategory(sample.cat);
      handleCropSelection(sample.crop, price);
    }
  };

  // Handle file input
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image size exceeds 5 MB limit.');
        return;
      }
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setFormError('');
    }
  };

  // Submit Listing
  const handleAddProduceSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!cropName.trim()) {
      setFormError('Please enter produce name.');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      setFormError('Please specify a positive quantity in kg.');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setFormError('Please specify a positive price per kg.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', cropName.trim());
      formData.append('category', category);
      formData.append('quantity', quantity);
      formData.append('price', price);
      formData.append('harvestDate', harvestDate);
      formData.append('location', location.trim());

      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      } else if (imagePreviewUrl) {
        formData.append('imageUrl', imagePreviewUrl);
      }

      const res = await apiRequest('/listings', {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        // Show AI grading outcome modal
        setGradingModalData({
          listing: res.listing,
          grading: res.grading,
          pricing: res.pricing,
        });

        // Reset form
        setCropName('');
        setQuantity('');
        setPrice('');
        setImagePreviewUrl('');
        setSelectedImageFile(null);
        setPricingAdvice(null);

        // Refresh listings
        fetchMyListings();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to submit produce listing.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete listing (only permitted while pending_fpo)
  const handleDeleteListing = async () => {
    if (!deleteListingTarget) return;

    try {
      const res = await apiRequest(`/listings/${deleteListingTarget._id || deleteListingTarget.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setMyListings((prev) => prev.filter((l) => (l._id || l.id) !== (deleteListingTarget._id || deleteListingTarget.id)));
        setDeleteListingTarget(null);
      }
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  // Load seasonal crop suggestions
  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const pastCropsList = Array.from(new Set(myListings.map((l) => l.name)));
      const res = await apiRequest('/ai/suggestions', {
        method: 'POST',
        body: {
          location: user?.address || 'Pune Agri Belt, Maharashtra',
          currentMonth: new Date().toLocaleString('default', { month: 'long' }),
          pastCrops: pastCropsList,
        },
      });

      if (res.success && res.suggestions) {
        setSuggestions(res.suggestions);
      }
    } catch (err) {
      console.warn('Suggestions error:', err.message);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Filtered listings
  const filteredListings = myListings.filter((item) => {
    if (listingFilter === 'all') return true;
    return item.status === listingFilter;
  });

  // Calculate Overview Stats
  const statTotal = myListings.length;
  const statPending = myListings.filter((l) => l.status === 'pending_fpo').length;
  const statApproved = myListings.filter((l) => l.status === 'approved').length;
  const statRejected = myListings.filter((l) => l.status === 'rejected' || l.status === 'auto_rejected').length;

  return (
    <SidebarLayout
      title="Farmer Management Portal"
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={setActiveNav}
    >
      <div className="farmer-dashboard">
        {/* ==================== 1. OVERVIEW SECTION ==================== */}
        {activeNav === 'overview' && (
          <>
            <div className="farmer-stats-grid">
              <div className="farmer-stat-card">
                <div className="stat-icon-wrapper">
                  <Package size={22} strokeWidth={1.75} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{statTotal}</span>
                  <span className="stat-label">Total Listings</span>
                </div>
              </div>

              <div className="farmer-stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef8ee', color: '#b7791f' }}>
                  <Clock size={22} strokeWidth={1.75} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{statPending}</span>
                  <span className="stat-label">Pending FPO Review</span>
                </div>
              </div>

              <div className="farmer-stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: '#eaf5ee', color: '#1e6b37' }}>
                  <CheckCircle2 size={22} strokeWidth={1.75} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{statApproved}</span>
                  <span className="stat-label">Approved & Live</span>
                </div>
              </div>

              <div className="farmer-stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: '#fdf2f2', color: '#a63d35' }}>
                  <XCircle size={22} strokeWidth={1.75} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{statRejected}</span>
                  <span className="stat-label">Rejected / Discarded</span>
                </div>
              </div>
            </div>

            <div className="farmer-section-card">
              <div className="section-card-header">
                <h2 className="section-card-title">Recent Produce Harvests</h2>
                <button className="phase1-btn" onClick={() => setActiveNav('add')}>
                  <PlusCircle size={15} strokeWidth={1.75} />
                  <span>List New Produce</span>
                </button>
              </div>

              {loadingListings ? (
                <LoadingSpinner message="Fetching your harvest history..." />
              ) : myListings.length === 0 ? (
                <EmptyState
                  title="No produce listed yet"
                  description="Begin listing your harvest to access transparent Mandi pricing and verified FPO aggregation."
                  actionLabel="Create First Listing"
                  onAction={() => setActiveNav('add')}
                />
              ) : (
                <div className="table-responsive">
                  <table className="clean-table">
                    <thead>
                      <tr>
                        <th>Produce</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Price/kg</th>
                        <th>AI Grade</th>
                        <th>Status</th>
                        <th>Harvest Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myListings.slice(0, 5).map((item) => (
                        <tr key={item._id || item.id}>
                          <td>
                            <div className="crop-cell">
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.name} className="crop-cell-img" />
                              )}
                              <strong>{item.name}</strong>
                            </div>
                          </td>
                          <td>{item.category}</td>
                          <td>{item.quantity} kg</td>
                          <td>
                            <strong>Rs {item.price}</strong>
                            {item.priceFlagged && (
                              <span style={{ marginLeft: 6 }}>
                                <StatusBadge status="flagged" />
                              </span>
                            )}
                          </td>
                          <td>
                            <StatusBadge status="grade" label={`Grade ${item.aiGrade}`} />
                          </td>
                          <td>
                            <StatusBadge status={item.status} />
                          </td>
                          <td style={{ color: 'var(--color-text-muted)' }}>{item.harvestDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ==================== 2. ADD PRODUCE SECTION ==================== */}
        {activeNav === 'add' && (
          <div className="farmer-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <PlusCircle size={18} strokeWidth={1.75} />
                <span>List Produce for FPO Verification</span>
              </h2>
            </div>

            {/* Voice Input Toolbar */}
            <div className="voice-bar">
              <div className="voice-bar-left">
                <button
                  type="button"
                  className={`btn-mic ${isListening ? 'listening' : ''}`}
                  onClick={toggleVoiceRecording}
                  disabled={!speechSupported}
                  title="Speak crop name, quantity, and price (e.g. 'Tomato 50 kg 30 rupees')"
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
                </button>

                <select
                  className="voice-lang-select"
                  value={voiceLang}
                  onChange={(e) => setVoiceLang(e.target.value)}
                  disabled={isListening}
                  aria-label="Select spoken language"
                >
                  <option value="en-IN">English (India)</option>
                  <option value="hi-IN">Hindi (हिन्दी)</option>
                  <option value="mr-IN">Marathi (मराठी)</option>
                  <option value="pa-IN">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="gu-IN">Gujarati (ગુજરાતી)</option>
                  <option value="bn-IN">Bengali (বাংলা)</option>
                  <option value="ta-IN">Tamil (தமிழ்)</option>
                  <option value="te-IN">Telugu (తెలుగు)</option>
                  <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                </select>
              </div>

              <div>
                {!speechSupported ? (
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Web Speech API not supported in this browser. Please type manually.
                  </span>
                ) : voiceTranscript ? (
                  <span className="voice-transcript-note">Heard: "{voiceTranscript}"</span>
                ) : (
                  <span className="voice-transcript-note">Say e.g.: "Tomato 50 kilo 30 rupees" or "Tamatar pachaas kilo tees rupaye"</span>
                )}
              </div>
            </div>

            {formError && (
              <div className="auth-error-msg" style={{ marginBottom: 16 }}>
                <AlertTriangle size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
                {formError}
              </div>
            )}

            <form onSubmit={handleAddProduceSubmit}>
              <div className="produce-form-grid">
                {/* Crop Name */}
                <div className="form-group">
                  <label className="form-label">Produce Name</label>
                  <input
                    type="text"
                    list="mandi-crops-list"
                    className="form-input"
                    placeholder="e.g. Tomato, Spinach, Grapes"
                    value={cropName}
                    onChange={(e) => {
                      setCropName(e.target.value);
                      handleCropSelection(e.target.value, price);
                    }}
                    required
                  />
                  <datalist id="mandi-crops-list">
                    {mandiRates.map((r) => (
                      <option key={r.crop} value={r.crop.charAt(0).toUpperCase() + r.crop.slice(1)} />
                    ))}
                  </datalist>
                </div>

                {/* Category */}
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Other">Other Agricultural</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="form-group">
                  <label className="form-label">Harvest Quantity (kg)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="form-input"
                    placeholder="e.g. 50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                {/* Price per kg */}
                <div className="form-group">
                  <label className="form-label">Your Selling Price (Rs / kg)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    className="form-input"
                    placeholder="e.g. 34"
                    value={price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    required
                  />
                </div>

                {/* Price Advice Callout Box (Full Width) */}
                {pricingAdvice && (
                  <div className="form-group-full">
                    <div className="pricing-advice-box">
                      <div className="pricing-formula-row">
                        <div>
                          <span>Prevailing Mandi Benchmark: <strong>Rs {pricingAdvice.mandiRate}/kg</strong></span>
                          <span style={{ margin: '0 8px', color: 'var(--color-text-muted)' }}>&middot;</span>
                          <span className="pricing-formula-text">Formula: {pricingAdvice.formula}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-use-suggested"
                          onClick={handleUseSuggestedPrice}
                        >
                          Use Suggested Price (Rs {pricingAdvice.suggested})
                        </button>
                      </div>

                      {pricingAdvice.warning && (
                        <div className="price-warning-alert">
                          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span>{pricingAdvice.warningMessage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Harvest Date */}
                <div className="form-group">
                  <label className="form-label">Harvest Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    required
                  />
                </div>

                {/* Farm Location */}
                <div className="form-group">
                  <label className="form-label">Farm Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Village, District"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>

                {/* Image Upload Zone */}
                <div className="form-group-full">
                  <label className="form-label">Produce Photo for AI Inspection</label>
                  <div className="image-upload-zone">
                    {imagePreviewUrl ? (
                      <img src={imagePreviewUrl} alt="Preview" className="image-preview-thumb" />
                    ) : (
                      <Upload size={24} color="var(--color-text-muted)" />
                    )}

                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        id="produce-image-file"
                        onChange={handleFileInput}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="produce-image-file" className="phase1-btn phase1-btn-outline" style={{ display: 'inline-block', cursor: 'pointer' }}>
                        Browse File (Max 5 MB)
                      </label>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Upload a picture from your phone:
                    </div>
                    <div className="sample-photos-row">
                      {SAMPLE_PHOTOS.map((sample) => (
                        <button
                          key={sample.label}
                          type="button"
                          className="sample-photo-btn"
                          onClick={() => handleSelectSamplePhoto(sample)}
                        >
                          {sample.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="submit"
                  className="phase1-btn"
                  style={{ padding: '10px 24px', fontSize: 14 }}
                  disabled={submitting}
                >
                  {submitting ? 'Running Gemini AI Quality Inspection...' : 'Submit Produce for Verification'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== 3. MY LISTINGS SECTION ==================== */}
        {activeNav === 'listings' && (
          <div className="farmer-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <Package size={18} strokeWidth={1.75} />
                <span>My Produce Listings</span>
              </h2>

              <button className="phase1-btn" onClick={() => setActiveNav('add')}>
                <PlusCircle size={15} strokeWidth={1.75} />
                <span>Add Produce</span>
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="filter-bar">
              {[
                { id: 'all', label: `All (${myListings.length})` },
                { id: 'pending_fpo', label: `Pending FPO (${statPending})` },
                { id: 'approved', label: `Approved (${statApproved})` },
                { id: 'rejected', label: `FPO Rejected (${myListings.filter((l) => l.status === 'rejected').length})` },
                { id: 'auto_rejected', label: `Auto-Rejected (${myListings.filter((l) => l.status === 'auto_rejected').length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`filter-tab ${listingFilter === tab.id ? 'active' : ''}`}
                  onClick={() => setListingFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loadingListings ? (
              <LoadingSpinner message="Loading listings..." />
            ) : filteredListings.length === 0 ? (
              <EmptyState
                title="No listings in this filter"
                description="Produce matching this filter criteria was not found."
              />
            ) : (
              <div className="table-responsive">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Produce</th>
                      <th>Qty</th>
                      <th>Price/kg</th>
                      <th>AI Grade</th>
                      <th>Status</th>
                      <th>Audit / Rejection Notes</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.map((item) => (
                      <tr key={item._id || item.id}>
                        <td>
                          <div className="crop-cell">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt={item.name} className="crop-cell-img" />
                            )}
                            <div>
                              <strong>{item.name}</strong>
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.category}</div>
                            </div>
                          </div>
                        </td>
                        <td>{item.quantity} kg</td>
                        <td>
                          <strong>Rs {item.price}</strong>
                          {item.priceFlagged && (
                            <div style={{ marginTop: 2 }}>
                              <StatusBadge status="flagged" />
                            </div>
                          )}
                        </td>
                        <td>
                          <StatusBadge status="grade" label={`Grade ${item.aiGrade}`} />
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {Math.round((item.aiConfidence || 0.85) * 100)}% conf
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                        <td style={{ maxWidth: 220, fontSize: 12 }}>
                          {item.status === 'auto_rejected' ? (
                            <span style={{ color: 'var(--color-danger)' }}>{item.rejectionReason || item.aiReason}</span>
                          ) : item.status === 'rejected' ? (
                            <span style={{ color: 'var(--color-danger)' }}>{item.rejectionReason}</span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)' }}>{item.aiReason}</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                          {item.harvestDate}
                        </td>
                        <td>
                          {item.status === 'pending_fpo' ? (
                            <button
                              className="btn-delete-item"
                              onClick={() => setDeleteListingTarget(item)}
                              title="Delete listing (Allowed while pending)"
                            >
                              <Trash2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                              Delete
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. PRICE INSIGHTS SECTION ==================== */}
        {activeNav === 'pricing' && (
          <div className="farmer-section-card">
            <div className="section-card-header">
              <div>
                <h2 className="section-card-title">
                  <TrendingUp size={18} strokeWidth={1.75} />
                  <span>Mandi Price Benchmarks & Formula Insights</span>
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Suggested Price formula: <strong>Rs X (Mandi Rate) x 1.2 = Rs Y</strong>. Prices above 1.5x are flagged for FPO review.
                </p>
              </div>

              <div style={{ position: 'relative', width: 220 }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Filter crop..."
                  value={mandiSearch}
                  onChange={(e) => setMandiSearch(e.target.value)}
                  style={{ paddingLeft: 32 }}
                />
              </div>
            </div>

            {loadingMandi ? (
              <LoadingSpinner message="Loading benchmark rates..." />
            ) : (
              <div className="table-responsive">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Crop</th>
                      <th>Category</th>
                      <th>Mandi Benchmark</th>
                      <th>Fair Suggested Price (1.2x)</th>
                      <th>Audit Threshold (1.5x)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mandiRates
                      .filter((r) => r.crop.toLowerCase().includes(mandiSearch.toLowerCase()))
                      .map((rate) => (
                        <tr key={rate.crop}>
                          <td>
                            <strong style={{ textTransform: 'capitalize' }}>{rate.crop}</strong>
                          </td>
                          <td>{rate.category}</td>
                          <td>
                            <strong>Rs {rate.ratePerKg}</strong> / kg
                          </td>
                          <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                            Rs {rate.suggestedPrice} / kg
                          </td>
                          <td style={{ color: '#b7791f' }}>
                            &gt; Rs {rate.warnAbove} / kg
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== 5. SUGGESTIONS SECTION ==================== */}
        {activeNav === 'suggestions' && (
          <div className="farmer-section-card">
            <div className="section-card-header">
              <div>
                <h2 className="section-card-title">
                  <Sparkles size={18} strokeWidth={1.75} />
                  <span>Gemini AI Seasonal Agronomy Recommendations</span>
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Tailored planting tips based on your regional climate ({user?.address || 'Pune Agri Belt'}) and seasonal demand windows.
                </p>
              </div>

              <button
                className="phase1-btn"
                onClick={handleGetSuggestions}
                disabled={loadingSuggestions}
              >
                <Sparkles size={14} />
                <span>{loadingSuggestions ? 'Querying Gemini...' : 'Get Fresh Suggestions'}</span>
              </button>
            </div>

            {loadingSuggestions ? (
              <LoadingSpinner message="Analyzing soil season and regional market demand with Gemini..." />
            ) : suggestions ? (
              <div className="suggestions-grid">
                {suggestions.map((item, idx) => (
                  <div key={idx} className="suggestion-card">
                    <h3 className="suggestion-title">{item.title}</h3>
                    <span className="suggestion-badge">{item.category}</span>

                    <div className="suggestion-metric-row">
                      <span>Harvest Turnaround:</span>
                      <strong>{item.expectedYieldWeeks}</strong>
                    </div>

                    <div className="suggestion-metric-row">
                      <span>Market Demand:</span>
                      <strong style={{ color: 'var(--color-primary)' }}>{item.marketDemand}</strong>
                    </div>

                    <p className="suggestion-reason">{item.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No suggestions generated yet"
                description="Click 'Get Fresh Suggestions' to receive Gemini agronomist guidance for your next cropping cycle."
                actionLabel="Generate Recommendations"
                onAction={handleGetSuggestions}
              />
            )}
          </div>
        )}
      </div>

      {/* ==================== AI QUALITY GRADING OUTCOME MODAL ==================== */}
      <Modal
        isOpen={!!gradingModalData}
        onClose={() => setGradingModalData(null)}
        title="AI Produce Quality Inspection Result"
        footer={
          <button className="phase1-btn" onClick={() => setGradingModalData(null)}>
            Acknowledge & View in Listings
          </button>
        }
      >
        {gradingModalData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor:
                    gradingModalData.grading.grade === 'C' ? '#fdf2f2' : '#eaf5ee',
                  color:
                    gradingModalData.grading.grade === 'C' ? 'var(--color-danger)' : 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 800,
                  border: `1px solid ${
                    gradingModalData.grading.grade === 'C' ? '#f5c4c2' : '#c2e2cc'
                  }`,
                }}
              >
                {gradingModalData.grading.grade}
              </div>

              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-sidebar)' }}>
                  Assigned Grade {gradingModalData.grading.grade}
                </h4>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Confidence: {Math.round(gradingModalData.grading.confidence * 100)}% &middot; Source: {gradingModalData.grading.source.toUpperCase()}
                </div>
              </div>
            </div>

            <div style={{ background: '#fafcf9', border: '1px solid var(--color-border-sage)', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: 13 }}>
              <strong>AI Diagnostic:</strong> {gradingModalData.grading.reason}
            </div>

            <div>
              <strong>Workflow Decision:</strong>
              {gradingModalData.grading.isAutoRejected ? (
                <div style={{ marginTop: 4, padding: 10, backgroundColor: '#fdf2f2', border: '1px solid #f5c4c2', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', fontSize: 13 }}>
                  <strong>Auto-Rejected:</strong> This produce does not meet marketplace freshness standards and will not be listed for sale.
                </div>
              ) : (
                <div style={{ marginTop: 4, padding: 10, backgroundColor: '#eaf5ee', border: '1px solid #c2e2cc', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)', fontSize: 13 }}>
                  <strong>Accepted:</strong> Produce submitted to FPO Hub with status <em>Pending Review</em>.
                </div>
              )}
            </div>

            {gradingModalData.listing.priceFlagged && (
              <div className="price-warning-alert">
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>Price Flagged: Your unit price is &gt;1.5x prevailing Mandi benchmark. FPO will perform price audit prior to market approval.</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      <Modal
        isOpen={!!deleteListingTarget}
        onClose={() => setDeleteListingTarget(null)}
        title="Confirm Produce Deletion"
        footer={
          <>
            <button
              type="button"
              className="phase1-btn phase1-btn-outline"
              onClick={() => setDeleteListingTarget(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="phase1-btn"
              style={{ backgroundColor: 'var(--color-danger)' }}
              onClick={handleDeleteListing}
            >
              Confirm Delete
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: 'var(--color-text)' }}>
          Are you sure you want to delete listing <strong>"{deleteListingTarget?.name}"</strong>?
          This action will permanently remove the record from the FPO review queue.
        </p>
      </Modal>
    </SidebarLayout>
  );
}
