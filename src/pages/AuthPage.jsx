import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  MapPin,
  Lock,
  Phone,
  User,
  ArrowRight,
  AlertCircle,
  Compass,
} from 'lucide-react';
import './AuthPage.css';

export default function AuthPage() {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialMode = location.state?.mode === 'signup' ? 'signup' : 'login';
  const defaultPhone = location.state?.defaultPhone || '';
  const defaultRole = location.state?.defaultRole || 'farmer';

  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [phone, setPhone] = useState(defaultPhone);
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(18.5204);
  const [lng, setLng] = useState(73.8567);
  const [locating, setLocating] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [user, navigate]);

  // Sync mode and role if navigation state changes
  useEffect(() => {
    if (location.state?.mode) {
      setMode(location.state.mode);
    }
    if (location.state?.defaultRole) {
      setRole(location.state.defaultRole);
    }
    if (location.state?.defaultPhone) {
      setPhone(location.state.defaultPhone);
    }
  }, [location.state]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Math.round(pos.coords.latitude * 10000) / 10000);
        setLng(Math.round(pos.coords.longitude * 10000) / 10000);
        setLocating(false);
      },
      (err) => {
        setError('Location access was denied or timed out. Using default hub coordinates.');
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const loggedUser = await login(phone, password);
        navigate(`/${loggedUser.role}`);
      } else {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!phone.trim()) throw new Error('Please enter your phone number.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const newUser = await signup({
          name: name.trim(),
          phone: phone.trim(),
          password,
          role,
          address: address.trim(),
          lat,
          lng,
        });
        navigate(`/${newUser.role}`);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoPhone, demoPassword = 'password123') => {
    setMode('login');
    setPhone(demoPhone);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Sprout size={24} strokeWidth={1.75} />
            <span>TraceCrop</span>
          </div>
          <p className="auth-subtitle">
            {mode === 'login' ? 'Sign in to your role dashboard' : 'Register for direct market access'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setError('');
            }}
          >
            Create Account
          </button>
        </div>

        <div className="auth-body">
          {error && (
            <div className="auth-error-msg" role="alert">
              <AlertCircle size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-name">Full Name</label>
                  <input
                    id="auth-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ramesh Patil"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="auth-role">Platform Role</label>
                  <select
                    id="auth-role"
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="farmer">Farmer (Produce Producer)</option>
                    <option value="fpo">FPO Hub (Review & Aggregation)</option>
                    <option value="customer">Customer (Direct Consumer)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="auth-address">Village / Hub Address</label>
                  <input
                    id="auth-address"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Wadgaon Farm 3, Haveli, Pune"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Geographic Coordinates</label>
                    <button
                      type="button"
                      className="btn-use-location"
                      onClick={handleUseLocation}
                      disabled={locating}
                    >
                      <Compass size={13} strokeWidth={1.75} />
                      <span>{locating ? 'Acquiring GPS...' : 'Use My Location'}</span>
                    </button>
                  </div>
                  <div className="location-picker-row">
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      placeholder="Latitude"
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      placeholder="Longitude"
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-phone">Phone Number</label>
              <input
                id="auth-phone"
                type="tel"
                className="form-input"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-auth-submit" disabled={loading}>
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In to Dashboard'
                : 'Complete Registration'}
            </button>
          </form>

          {/* Quick Demo Accounts Helper for Live Evaluation */}
          <div className="demo-accounts-box">
            <div className="demo-title">Judge & Demo One-Click Access</div>
            <div className="demo-chips">
              <button
                type="button"
                className="demo-chip"
                onClick={() => fillDemoAccount('9876543210')}
              >
                <span className="demo-chip-role">Farmer 1</span>
                <span className="demo-chip-name">Ramesh Patil</span>
              </button>

              <button
                type="button"
                className="demo-chip"
                onClick={() => fillDemoAccount('9876543211')}
              >
                <span className="demo-chip-role">Farmer 2</span>
                <span className="demo-chip-name">Suresh Deshmukh</span>
              </button>

              <button
                type="button"
                className="demo-chip"
                onClick={() => fillDemoAccount('9876543220')}
              >
                <span className="demo-chip-role">FPO Hub</span>
                <span className="demo-chip-name">Sahyadri Co.</span>
              </button>

              <button
                type="button"
                className="demo-chip"
                onClick={() => fillDemoAccount('9876543230')}
              >
                <span className="demo-chip-role">Customer 1</span>
                <span className="demo-chip-name">Priya Sharma</span>
              </button>

              <button
                type="button"
                className="demo-chip"
                onClick={() => fillDemoAccount('9876543231')}
              >
                <span className="demo-chip-role">Customer 2</span>
                <span className="demo-chip-name">Amit Joshi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
