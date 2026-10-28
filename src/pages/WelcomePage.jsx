import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  ShieldCheck,
  Truck,
  ShoppingBag,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Cpu,
  Layers,
} from 'lucide-react';
import './WelcomePage.css';

export default function WelcomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, provide direct jump to their dashboard
  const userDashboard = user ? `/${user.role}` : '/auth';

  return (
    <div className="welcome-page">
      {/* Top Navbar */}
      <header className="welcome-nav">
        <div className="welcome-brand">
          <Sprout size={24} strokeWidth={1.75} />
          <span>TraceCrop</span>
        </div>

        <div className="welcome-nav-actions">
          {user ? (
            <Link to={userDashboard} className="btn-nav-signup">
              Go to {user.role.toUpperCase()} Dashboard
            </Link>
          ) : (
            <>
              <Link to="/auth" state={{ mode: 'login' }} className="btn-nav-login">
                Log In
              </Link>
              <Link to="/auth" state={{ mode: 'signup' }} className="btn-nav-signup">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="welcome-hero">
        <div className="welcome-badge">
          <ShieldCheck size={14} strokeWidth={1.75} />
          <span>Verified Farm-to-Customer Value Chain</span>
        </div>

        <h1 className="welcome-headline">
          Transparent Farm-to-Customer Produce Marketplace
        </h1>

        <p className="welcome-subhead">
          TraceCrop connects farmers, FPO aggregation hubs, and conscious consumers with AI-driven quality inspection, fair Mandi pricing transparency, and optimized cluster dispatch.
        </p>

        <div className="welcome-hero-buttons">
          <Link to="/auth" state={{ mode: 'signup' }} className="btn-primary-large">
            <span>Explore Roles & Get Started</span>
            <ArrowRight size={18} strokeWidth={1.75} />
          </Link>
          <Link to="/auth" state={{ mode: 'login' }} className="btn-secondary-large">
            <span>Access Demo Accounts</span>
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="welcome-section" style={{ backgroundColor: '#fafcf9', borderTop: '1px solid var(--color-border-sage)', borderBottom: '1px solid var(--color-border-sage)' }}>
        <div className="section-header">
          <h2 className="section-title">How TraceCrop Operates</h2>
          <p className="section-subtitle">A synchronized 4-stage verified supply chain governed by strict status machine rules</p>
        </div>

        <div className="workflow-steps-grid">
          <div className="workflow-step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Farmer Lists Produce</h3>
            <p className="step-desc">
              Farmers upload crop harvest details and photos. Gemini Vision AI inspects quality (Grade A/B/C) while backend algorithms benchmark against real Mandi rates.
            </p>
          </div>

          <div className="workflow-step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">FPO Hub Verifies</h3>
            <p className="step-desc">
              Farmer Producer Organizations review incoming produce, check price flags, approve high-grade harvests, and schedule regional collection.
            </p>
          </div>

          <div className="workflow-step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Customer Orders</h3>
            <p className="step-desc">
              Customers browse verified fresh harvests, inspect full provenance and AI grades, and order with real-time atomic inventory deduction.
            </p>
          </div>

          <div className="workflow-step-card">
            <div className="step-number">4</div>
            <h3 className="step-title">FPO Cluster Delivers</h3>
            <p className="step-desc">
              Greedy proximity clustering groups orders into optimal 8 km / 200 kg vehicle routes solved via OSRM turn-by-turn road dispatch.
            </p>
          </div>
        </div>
      </section>

      {/* 3 Role Cards */}
      <section className="welcome-section">
        <div className="section-header">
          <h2 className="section-title">Three Roles, One Unified Marketplace</h2>
          <p className="section-subtitle">Dedicated operational workspaces tailored for every participant in the ecosystem</p>
        </div>

        <div className="roles-grid">
          {/* Farmer Card */}
          <div className="role-card">
            <div className="role-card-header">
              <div className="role-icon-box">
                <Sprout size={22} strokeWidth={1.75} />
              </div>
              <h3 className="role-card-title">Farmer</h3>
            </div>
            <p className="role-card-desc">
              Direct access to fair wholesale returns without unverified middleman commissions.
            </p>
            <ul className="role-card-features">
              <li><CheckCircle size={15} color="var(--color-primary)" /> AI Vision Quality Grading</li>
              <li><CheckCircle size={15} color="var(--color-primary)" /> Mandi Rate Advice & 1.2x Benchmark</li>
              <li><CheckCircle size={15} color="var(--color-primary)" /> Multilingual Voice Input</li>
              <li><CheckCircle size={15} color="var(--color-primary)" /> Seasonal Agronomy Recommendations</li>
            </ul>
            <div className="role-card-actions">
              <Link to="/auth" state={{ mode: 'signup', defaultRole: 'farmer' }} className="btn-role-action primary">
                <span>Register as Farmer</span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
              <Link to="/auth" state={{ mode: 'login', defaultRole: 'farmer', defaultPhone: '9876543210' }} className="btn-role-action secondary">
                <span>Demo Account (Ramesh)</span>
              </Link>
            </div>
          </div>

          {/* FPO Card */}
          <div className="role-card">
            <div className="role-card-header">
              <div className="role-icon-box">
                <Truck size={22} strokeWidth={1.75} />
              </div>
              <h3 className="role-card-title">FPO Hub</h3>
            </div>
            <p className="role-card-desc">
              Regional aggregation center managing physical inspection, batch routing, and delivery logistics.
            </p>
            <ul className="role-card-features">
              <li><CheckCircle size={15} color="var(--color-primary)" /> Produce Inspection & Review Queue</li>
              <li><CheckCircle size={15} color="var(--color-primary)" /> Price Spike Audit Warnings</li>
              <li><CheckCircle size={15} color="var(--color-primary)" /> Smart Proximity Clustering (8 km / 200 kg)</li>
              <li><CheckCircle size={15} color="var(--color-primary)" /> Interactive OSRM Route Map</li>
            </ul>
            <div className="role-card-actions">
              <Link to="/auth" state={{ mode: 'signup', defaultRole: 'fpo' }} className="btn-role-action primary">
                <span>Register as FPO Hub</span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
              <Link to="/auth" state={{ mode: 'login', defaultRole: 'fpo', defaultPhone: '9876543220' }} className="btn-role-action secondary">
                <span>Demo Account (Sahyadri)</span>
              </Link>
            </div>
          </div>

          {/* Customer Card */}
          <div className="role-card">
            <div className="role-card-header">
              <div className="role-icon-box">
                <ShoppingBag size={22} strokeWidth={1.75} />
              </div>
              <h3 className="role-card-title">Customer</h3>
            </div>
            <p className="role-card-desc">
              Direct access to fresh, authenticated farm produce with transparent harvest origins.
            </p>
            <ul className="role-card-features">
              <li><CheckCircle size={15} color="var(--color-primary)" /> Verified Farm Source & Harvest Date</li>
              <li><CheckCircle size={15} color="var(--color-primary)" /> AI Quality Inspection Badges</li>
              <li><CheckCircle size={15} color="var(--color-primary)" /> QR Code Public Traceability</li>
              <li><CheckCircle size={15} color="var(--color-primary)" /> Live Stage Timeline (Placed to Delivered)</li>
            </ul>
            <div className="role-card-actions">
              <Link to="/auth" state={{ mode: 'signup', defaultRole: 'customer' }} className="btn-role-action primary">
                <span>Register as Customer</span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
              <Link to="/auth" state={{ mode: 'login', defaultRole: 'customer', defaultPhone: '9876543230' }} className="btn-role-action secondary">
                <span>Demo Account (Priya)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="welcome-footer">
        <p>TraceCrop &middot; Farm-to-Customer Produce Marketplace &middot; Hackathon Prototype</p>
      </footer>
    </div>
  );
}
