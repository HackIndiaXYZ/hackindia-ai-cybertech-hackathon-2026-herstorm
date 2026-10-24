
import { useEffect, useState } from "react";
import "./App.css";
import translations from "./i18n/translations";
import FarmerDashboard from "./pages/FarmerDashboard";

function App() {
  const [language, setLanguage] = useState(
    () => localStorage.getItem("tracecrop-language") || "en"
  );
  const [showDashboard, setShowDashboard] = useState(
  () => localStorage.getItem("tracecrop-demo-session") === "farmer"
);
  const [showAuth, setShowAuth] = useState(
  () => localStorage.getItem("tracecrop-current-page") === "auth"
);
  const [authMode, setAuthMode] = useState("login");
  const [selectedRole, setSelectedRole] = useState("farmer");
  const [showPassword, setShowPassword] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const t = translations[language] || translations.en;

  useEffect(() => {
    localStorage.setItem("tracecrop-language", language);
    document.documentElement.lang = language === "hi" ? "hi" : "en";
  }, [language]);

  const openAuth = (mode = "login") => {
  setAuthMode(mode);
  setFormMessage("");
  localStorage.setItem("tracecrop-current-page", "auth");
  setShowAuth(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

  const updateField = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
    setFormMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (authMode === "signup" && !formData.name.trim()) {
      setFormMessage(t.authNameRequired);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormMessage(t.authEmailInvalid);
      return;
    }

    if (formData.password.length < 6) {
      setFormMessage(t.authPasswordInvalid);
      return;
    }

    
    localStorage.setItem("tracecrop-demo-session", "farmer");
setFormMessage(t.authDemoSuccess);
setShowDashboard(true);
  };

  const changeMode = (mode) => {
    setAuthMode(mode);
    setFormMessage("");
  };
  if (showDashboard) {
  return (
    <FarmerDashboard
      language={language}
      onBack={() => {
        localStorage.removeItem("tracecrop-demo-session");
        setShowDashboard(false);
      }}
    />
  );
}

  return (
    <div className={`app ${language === "hi" ? "hindi" : ""}`}>
      <header className="navbar">
        <button
          className="brand"
          type="button"
          onClick={() => {
  localStorage.removeItem("tracecrop-current-page");
  localStorage.removeItem("tracecrop-demo-session");
  setShowDashboard(false);
  setShowAuth(false);
  setFormMessage("");
}}
          aria-label="TraceCrop home"
        >
          <span className="brand-mark">🌱</span>
          <span className="brand-text">
            <strong>{t.brand}</strong>
            <small>{t.tagline}</small>
          </span>
        </button>

        <div className="nav-actions">
          <span className="demo-badge">{t.demoLabel}</span>

          <div className="language-switch" aria-label={t.language}>
            <button
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
              aria-pressed={language === "en"}
              type="button"
            >
              EN
            </button>
            <button
              className={language === "hi" ? "active" : ""}
              onClick={() => setLanguage("hi")}
              aria-pressed={language === "hi"}
              type="button"
            >
              हिं
            </button>
          </div>
        </div>
      </header>

      {showAuth ? (
        <main className="auth-page">
          <button
            type="button"
            className="back-link"
           onClick={() => {
  localStorage.removeItem("tracecrop-current-page");
  setShowAuth(false);
  setFormMessage("");
}}
          >
            ← {t.authBack}
          </button>

          <section className="auth-layout">
            <div className="auth-intro">
              <span className="auth-leaf">🌱</span>
              <p className="section-kicker">{t.brand}</p>
              <h1>{t.authWelcome}</h1>
              <p className="auth-intro-description">
                {t.authDescription}
              </p>

              <div className="auth-benefits">
                <div><span>✓</span>{t.authBenefit1}</div>
                <div><span>✓</span>{t.authBenefit2}</div>
                <div><span>✓</span>{t.authBenefit3}</div>
              </div>

              <div className="auth-demo-note">{t.demoLabel}</div>
            </div>

            <div className="auth-card">
              <div className="auth-card-heading">
                <span className="auth-card-icon">🌾</span>
                <h2>
                  {authMode === "login"
                    ? t.authLoginTitle
                    : t.authSignupTitle}
                </h2>
                <p>
                  {authMode === "login"
                    ? t.authLoginSubtitle
                    : t.authSignupSubtitle}
                </p>
              </div>

              <div className="auth-tabs">
                <button
                  type="button"
                  className={authMode === "login" ? "active" : ""}
                  onClick={() => changeMode("login")}
                >
                  {t.authLoginTab}
                </button>
                <button
                  type="button"
                  className={authMode === "signup" ? "active" : ""}
                  onClick={() => changeMode("signup")}
                >
                  {t.authSignupTab}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                {authMode === "signup" && (
                  <>
                    <label htmlFor="auth-name">{t.authNameLabel}</label>
                    <input
                      id="auth-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder={t.authNamePlaceholder}
                      value={formData.name}
                      onChange={updateField}
                      required
                    />

                    <label>{t.authRoleLabel}</label>
                    <div className="role-choice-grid">
                      {[
                        { value: "farmer", icon: "🌾", label: t.farmer },
                        { value: "fpo", icon: "🏡", label: t.fpo },
                        { value: "customer", icon: "🛒", label: t.customer },
                      ].map((role) => (
                        <button
                          type="button"
                          key={role.value}
                          className={
                            selectedRole === role.value
                              ? "role-choice selected"
                              : "role-choice"
                          }
                          onClick={() => setSelectedRole(role.value)}
                          aria-pressed={selectedRole === role.value}
                        >
                          <span>{role.icon}</span>
                          <span>{role.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <label htmlFor="auth-email">{t.authEmailLabel}</label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t.authEmailPlaceholder}
                  value={formData.email}
                  onChange={updateField}
                  required
                />

                <label htmlFor="auth-password">{t.authPasswordLabel}</label>
                <div className="password-field">
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      authMode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    placeholder={t.authPasswordPlaceholder}
                    value={formData.password}
                    onChange={updateField}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? t.authHidePassword
                        : t.authShowPassword
                    }
                  >
                    {showPassword ? t.authHidePassword : t.authShowPassword}
                  </button>
                </div>

                {authMode === "login" && (
                  <p className="auth-helper">{t.authPasswordHint}</p>
                )}

                {formMessage && (
                  <div
                    className={
                      formMessage === t.authDemoSuccess
                        ? "form-message success"
                        : "form-message error"
                    }
                    role="status"
                  >
                    {formMessage}
                  </div>
                )}

                <button className="primary-button auth-submit" type="submit">
                  {authMode === "login"
                    ? t.authLoginButton
                    : t.authSignupButton}
                  <span aria-hidden="true"> →</span>
                </button>

                <p className="auth-terms">{t.authDemoNotice}</p>
              </form>

              <p className="auth-switch">
                {authMode === "login"
                  ? t.authNoAccount
                  : t.authHaveAccount}{" "}
                <button
                  type="button"
                  onClick={() =>
                    changeMode(authMode === "login" ? "signup" : "login")
                  }
                >
                  {authMode === "login"
                    ? t.authSignupTab
                    : t.authLoginTab}
                </button>
              </p>
            </div>
          </section>
        </main>
      ) : (
        <>
          <main id="home">
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  {t.badge}
                </div>

                <h1>
                  {t.titleStart}
                  <br />
                  <span>{t.titleEnd}</span>
                </h1>

                <p className="hero-description">{t.description}</p>

                <div className="role-list">
                  <div className="role-item">
                    <span className="role-icon">🌾</span>
                    <span>{t.farmer}</span>
                  </div>
                  <div className="role-item">
                    <span className="role-icon">🏡</span>
                    <span>{t.fpo}</span>
                  </div>
                  <div className="role-item">
                    <span className="role-icon">🛒</span>
                    <span>{t.customer}</span>
                  </div>
                </div>

                <button
                  className="primary-button"
                  type="button"
                  onClick={() => openAuth("login")}
                >
                  {t.getStarted}
                  <span aria-hidden="true"> →</span>
                </button>
              </div>

              <div className="hero-art" aria-label="Agriculture illustration">
                <div className="art-orbit orbit-one" />
                <div className="art-orbit orbit-two" />
                <div className="art-circle">
                  <span className="sun">☀</span>
                  <span className="plant plant-left">🌿</span>
                  <span className="plant plant-right">🌿</span>
                  <span className="crop">🌱</span>
                  <span className="soil" />
                </div>
                <div className="floating-card quality-card">
                  <span className="floating-icon">✓</span>
                  <span>
                    <strong>{t.feature1}</strong>
                    <small>{t.demoLabel}</small>
                  </span>
                </div>
                <div className="floating-card price-card">
                  <span className="floating-icon price-icon">₹</span>
                  <span>
                    <strong>{t.feature2}</strong>
                    <small>{t.demoLabel}</small>
                  </span>
                </div>
              </div>
            </section>

            <section className="features-section" id="features">
              <div className="section-heading">
                <span className="section-kicker">{t.brand}</span>
                <h2>{t.featuresTitle}</h2>
              </div>

              <div className="feature-grid">
                <article className="feature-card">
                  <div className="feature-icon quality-icon">◈</div>
                  <h3>{t.feature1}</h3>
                  <p>{t.feature1Desc}</p>
                </article>
                <article className="feature-card">
                  <div className="feature-icon price-feature-icon">₹</div>
                  <h3>{t.feature2}</h3>
                  <p>{t.feature2Desc}</p>
                </article>
                <article className="feature-card">
                  <div className="feature-icon trace-icon">⌁</div>
                  <h3>{t.feature3}</h3>
                  <p>{t.feature3Desc}</p>
                </article>
              </div>
            </section>
          </main>

          <footer className="footer">
            <span>🌱 {t.brand}</span>
            <span>{t.footer}</span>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
