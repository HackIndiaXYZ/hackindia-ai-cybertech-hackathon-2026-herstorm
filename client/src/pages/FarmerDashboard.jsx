import { useState, useEffect } from "react";
import {
  LayoutDashboard, Sprout, ClipboardList, Truck, Store,
  Users, IndianRupee, UserRound, CircleHelp, Bell,
  Search, Plus, ArrowUpRight, Leaf, Package, Menu, X,
  ChevronDown, ShoppingBasket, Sparkles, QrCode, Camera,
  TrendingUp, MapPin, ShieldCheck,LogOut
} from "lucide-react";
import "./FarmerDashboard.css";

const demoOrders = [
  { product: "Tomato", buyer: "Reliance Fresh", quantity: "500 kg", status: "Delivered", date: "12 Apr 2025", color: "tomato" },
  { product: "Potato", buyer: "Local Retailer", quantity: "1,000 kg", status: "In Transit", date: "11 Apr 2025", color: "potato" },
  { product: "Onion", buyer: "Big Basket", quantity: "750 kg", status: "Shipped", date: "10 Apr 2025", color: "onion" },
  { product: "Green Chilli", buyer: "FreshMart", quantity: "300 kg", status: "Delivered", date: "09 Apr 2025", color: "chilli" }
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Products", icon: Package },
  { label: "Orders", icon: ClipboardList },
  { label: "Logistics", icon: Truck },
  { label: "Marketplace", icon: Store },
  { label: "FPO Network", icon: Users },
  { label: "Earnings", icon: IndianRupee },
  { label: "Profile", icon: UserRound },
  { label: "Help & Support", icon: CircleHelp }
];

const copy = {
  en: {
    dashboard: "Farmer Dashboard",
    welcome: "Welcome back, Ramesh!",
    subtitle: "Here's what's happening with your farm today.",
    search: "Search products, buyers, or FPOs...",
    sales: "Total Sales", activeOrders: "Active Orders",
    transit: "In Transit", products: "Products Listed",
    buyers: "Active Buyers", fpos: "FPO Partners",
    earnings: "Total Earnings", recent: "Recent Orders",
    viewAll: "View all", salesOverview: "Sales Overview",
    last7: "Last 7 days", quick: "Quick Actions",
    add: "List New Product", marketplace: "View Marketplace",
    track: "Track Delivery", manage: "Manage FPO",
    messages: "Recent Messages", tip: "Today's Farming Tip",
    tipText: "Keep your crops well irrigated during high temperatures to maintain yield quality.",
    promo: "Your Produce. Our Priority.",
    promoText: "From farm to market — with trust, transparency and fair value.",
    start: "Start Selling", demo: "DEMO DATA",
    buyer: "Buyer", quantity: "Quantity", status: "Status", date: "Date",
    delivered: "Delivered", inTransit: "In Transit", shipped: "Shipped",
    greeting: "Farmer", weather: "Partly Cloudy",
    demoNotice: "Sample figures for demonstration only",
    grading: "AI Quality Grading", pricing: "Smart Pricing",
    trace: "QR Traceability", newProduct: "Add Produce",
    noConnection: "Frontend demo — no live account or market data connected."
  },
  hi: {
    dashboard: "किसान डैशबोर्ड",
    welcome: "वापसी पर स्वागत है, रमेश!",
    subtitle: "आज आपके खेत से जुड़ी जानकारी यहाँ है।",
    search: "उत्पाद, खरीदार या FPO खोजें...",
    sales: "कुल बिक्री", activeOrders: "सक्रिय ऑर्डर",
    transit: "रास्ते में", products: "सूचीबद्ध उत्पाद",
    buyers: "सक्रिय खरीदार", fpos: "FPO साझेदार",
    earnings: "कुल कमाई", recent: "हाल के ऑर्डर",
    viewAll: "सभी देखें", salesOverview: "बिक्री का विवरण",
    last7: "पिछले 7 दिन", quick: "त्वरित कार्य",
    add: "नया उत्पाद जोड़ें", marketplace: "मार्केटप्लेस देखें",
    track: "डिलीवरी ट्रैक करें", manage: "FPO प्रबंधित करें",
    messages: "हाल के संदेश", tip: "आज की खेती की सलाह",
    tipText: "अधिक तापमान में फसल की गुणवत्ता बनाए रखने के लिए पर्याप्त सिंचाई करें।",
    promo: "आपकी उपज, हमारी प्राथमिकता।",
    promoText: "खेत से बाज़ार तक — भरोसे, पारदर्शिता और उचित मूल्य के साथ।",
    start: "बिक्री शुरू करें", demo: "डेमो डेटा",
    buyer: "खरीदार", quantity: "मात्रा", status: "स्थिति", date: "तारीख",
    delivered: "डिलीवर हुआ", inTransit: "रास्ते में", shipped: "भेज दिया गया",
    greeting: "किसान", weather: "आंशिक बादल",
    demoNotice: "केवल प्रदर्शन के लिए नमूना आँकड़े",
    grading: "AI गुणवत्ता जाँच", pricing: "स्मार्ट मूल्य",
    trace: "QR ट्रेसबिलिटी", newProduct: "उपज जोड़ें",
    noConnection: "फ्रंटएंड डेमो — लाइव खाते या बाज़ार का डेटा जुड़ा नहीं है।"
  }
};

function Metric({ icon: Icon, label, value, trend, subtle }) {
  return (
    <article className="tc-metric">
      <span className="tc-metric-icon"><Icon size={23} /></span>
      <div className="tc-metric-copy">
        <span className="tc-muted">{label}</span>
        <strong>{value}</strong>
        <small className="tc-trend"><TrendingUp size={13} /> {trend}</small>
      </div>
      {subtle && <span className="tc-metric-subtle">{subtle}</span>}
    </article>
  );
}

export default function FarmerDashboard({ language = "en", onBack }) {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  
  const [products, setProducts] = useState([]);

  const [showProductForm, setShowProductForm] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    quantity: "",
    price: "",
    harvestDate: "",
    location: "",
  });

  
useEffect(() => {
  const loadProducts = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/listings"
      );

      if (!response.ok) {
        throw new Error("Failed to load products");
      }

      const data = await response.json();
      setProducts(data.listings);
    } catch (error) {
      console.error("Error loading products:", error);
      setNotice(
        "Could not load products. Please check that the backend is running."
      );
    }
  };

  loadProducts();
}, []);


  const handleProductFieldChange = (event) => {
    const { name, value } = event.target;

    setProductForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  
const handleProductSubmit = async (event) => {
  event.preventDefault();

  const quantity = Number(productForm.quantity);
  const price = Number(productForm.price);

  if (
    !productForm.name.trim() ||
    !productForm.harvestDate ||
    !productForm.location.trim() ||
    !Number.isFinite(quantity) ||
    !Number.isFinite(price) ||
    quantity <= 0 ||
    price <= 0
  ) {
    setNotice("Please fill in every field with valid values.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/listings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: productForm.name.trim(),
          quantity,
          price,
          harvestDate: productForm.harvestDate,
          location: productForm.location.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not save product");
    }

    setProducts((previous) => [
      data.listing,
      ...previous,
    ]);

    setProductForm({
      name: "",
      quantity: "",
      price: "",
      harvestDate: "",
      location: "",
    });

    setShowProductForm(false);
    setNotice("Produce listed successfully!");
  } catch (error) {
    console.error("Error saving product:", error);
    setNotice("Could not save product. Please try again.");
  }
};


  
const handleDeleteProduct = async (id) => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/listings/${id}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not delete product");
    }

    setProducts((previous) =>
      previous.filter((product) => product.id !== id)
    );

    setNotice("Product listing deleted.");
  } catch (error) {
    console.error("Error deleting product:", error);
    setNotice("Could not delete product. Please try again.");
  }
};


  const t = copy[language] || copy.en;
  const handleLogout = () => {
  localStorage.removeItem("tracecrop-demo-session");
  localStorage.removeItem("tracecrop-current-page");

  if (onBack) {
    onBack();
  }
};

  
const go = (label) => {
  setActiveNav(label);
  setMobileNav(false);
  setNotice("");

  if (label === "Dashboard") {
    setShowProductForm(false);
  }
};


  const filteredOrders = demoOrders.filter((order) =>
    `${order.product} ${order.buyer} ${order.status}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="tc-dashboard">
      {mobileNav && (
        <button className="tc-mobile-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)} />
      )}

      <aside className={`tc-sidebar ${mobileNav ? "tc-sidebar-open" : ""}`}>
        <div className="tc-brand">
          <div className="tc-brand-mark"><Sprout size={34} /></div>
          <div><strong>TraceCrop</strong><span>Farm to Family</span></div>
          <button className="tc-icon-button tc-mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X /></button>
        </div>

        <nav className="tc-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`tc-nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => go(label)}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="tc-sidebar-footer">
  <Sprout size={26} />
  <strong>Better Trade.<br />Brighter Future.</strong>
  <small>TraceCrop · Demo</small>

  <button
    type="button"
    className="tc-logout-button"
    onClick={handleLogout}
  > LogOut
    <LogOut size={18} />
    <span>{t.logout}</span>
  </button>
</div>
      </aside>

      <main className="tc-main">
        <header className="tc-topbar">
          <button className="tc-icon-button tc-mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu /></button>
          <label className="tc-search">
            <Search size={19} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} />
          </label>
          <div className="tc-top-actions">
            <button className="tc-icon-button tc-bell" onClick={() => setNotice("You are all caught up!")} aria-label="Notifications">
              <Bell size={21} /><i>3</i>
            </button>
            <button className="tc-profile" onClick={() => go("Profile")}>
              <span className="tc-avatar">RP</span>
              <span><strong>Ramesh Patel</strong><small>{t.greeting}</small></span>
              <ChevronDown size={16} />
            </button>
          </div>
        </header>

        <div className="tc-content">
          <div className="tc-page-heading">
            <div><span className="tc-eyebrow">{t.dashboard}</span><h1>{t.welcome}</h1><p>{t.subtitle}</p></div>
            <span className="tc-demo-pill"><span /> {t.demo}</span>
          </div>

          {notice && <div className="tc-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={16} /></button></div>}


{/* my product section: */}

{activeNav === "My Products" && (
  <section className="tc-panel tc-my-products">
    <div className="tc-panel-heading">
      <div>
        <h3>My Products</h3>
        <p>Manage your saved produce listings.</p>
      </div>

      <button
        className="tc-btn tc-btn-primary"
        onClick={() => {
          setShowProductForm(true);
          setNotice("");
        }}
      >
        <Plus size={16} /> Add Produce
      </button>
    </div>

    {products.length === 0 ? (
      <div className="tc-products-empty">
        <Sprout size={38} />
        <h3>No products listed yet</h3>
        <p>Add your first produce listing to see it here.</p>
      </div>
    ) : (
      <div className="tc-products-list">
        {products
          .filter((product) =>
            `${product.name} ${product.location}`
              .toLowerCase()
              .includes(search.toLowerCase())
          )
          .map((product) => (
            <article className="tc-product-item" key={product.id}>
              <div className="tc-product-item-icon">
                <Sprout size={24} />
              </div>

              <div className="tc-product-item-details">
                <h4>{product.name}</h4>
                <p>{product.quantity} kg available</p>
                <p>Harvest date: {product.harvestDate}</p>
                <p>
                  <MapPin size={14} /> {product.location}
                </p>
              </div>

              <div className="tc-product-item-price">
                <strong>
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </strong>
                <span>per kg</span>

                <button
                  type="button"
                  className="tc-product-delete"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
      </div>
    )}
  </section>
)}


          <section
  className="tc-dashboard-grid"
  style={{
    display: activeNav === "My Products" ? "none" : undefined,
  }}
>
            <div className="tc-primary-column">
              <section className="tc-hero">
                <div className="tc-hero-content">
                  <span className="tc-hero-brand"><Sprout size={27} /> TraceCrop</span>
                  <h2>Connecting Farmers<br />and FPOs Directly to Buyers</h2>
                  <p>Transparent. Trusted. Efficient.</p>
                  <div className="tc-hero-actions">
                    <button className="tc-btn tc-btn-primary" onClick={() => go("Marketplace")}>{t.marketplace} <ArrowUpRight size={16} /></button>
                    <button className="tc-btn tc-btn-light" onClick={() => go("Orders")}>{t.viewAll} {t.recent}</button>
                  </div>
                </div>
                <div className="tc-hero-decoration"><Leaf size={45} /><span>Freshness that<br />travels from<br />farm to family.</span></div>
              </section>

              <section className="tc-metrics-grid">
                <Metric icon={Sprout}label={t.products} value={products.length}trend="Live"/>
                <Metric icon={Users} label={t.buyers} value="18" trend="Demo data"/>
                <Metric icon={Users} label={t.fpos} value="5" trend="Demo data"/>
                <Metric icon={IndianRupee} label={t.earnings} value="₹36,850" trend="Demo data"/>

              </section>

              <div className="tc-data-grid">
                <section className="tc-panel tc-orders">
                  <div className="tc-panel-heading"><h3>{t.recent}</h3><button onClick={() => go("Orders")}>{t.viewAll} <ArrowUpRight size={14} /></button></div>
                  <div className="tc-table-wrap">
                    <table className="tc-order-table">
                      <thead><tr><th>Product</th><th>{t.buyer}</th><th>{t.quantity}</th><th>{t.status}</th><th>{t.date}</th></tr></thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.product}>
                            <td><span className={`tc-produce-thumb ${order.color}`}><Sprout size={17} /></span><strong>{order.product}</strong></td>
                            <td>{order.buyer}</td><td>{order.quantity}</td>
                            <td><span className={`tc-status ${order.status.toLowerCase().replace(" ", "-")}`}>{language === "hi" ? (order.status === "Delivered" ? t.delivered : order.status === "In Transit" ? t.inTransit : t.shipped) : order.status}</span></td>
                            <td>{order.date}</td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && <tr><td colSpan="5" className="tc-empty">No matching demo orders.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="tc-panel tc-sales">
                  <div className="tc-panel-heading"><h3>{t.salesOverview}</h3><span className="tc-select-label">{t.last7}</span></div>
                  <div className="tc-chart">
                    {[18, 25, 31, 36, 44, 52, 64].map((height, i) => (
                      <div className="tc-chart-column" key={i}>
                        <span>{`₹${[10, 15, 20, 25, 30, 35, 40][i]}k`}</span>
                        <div style={{ height: `${height}%` }} />
                        <small>{`${6 + i} Apr`}</small>
                      </div>
                    ))}
                  </div>
                  <small className="tc-chart-note">{t.demoNotice}</small>
                </section>
              </div>

              <section className="tc-promo">
                <div className="tc-promo-art"><ShoppingBasket size={58} /><Sprout size={34} /></div>
                <div className="tc-promo-copy"><h3>{t.promo}</h3><p>{t.promoText}</p><button className="tc-btn tc-btn-primary" onClick={() => {
  setShowProductForm(true);
  setNotice("");
}} >{t.start} <ArrowUpRight size={15} /></button></div>
                <div className="tc-promo-benefits"><span><ShieldCheck size={16} /> Secure payments</span><span><ShieldCheck size={16} /> Verified buyers</span><span><Truck size={16} /> Real-time tracking</span></div>
              </section>
            </div>

            <aside className="tc-right-column">
              <Metric icon={Leaf} label={t.sales} value="₹48,320" trend="+12%" subtle="vs. last 7 days" />
              <Metric icon={Package} label={t.activeOrders} value="6" trend="+2 new" subtle="vs. yesterday" />
              <Metric icon={Truck} label={t.transit} value="3" trend=" " subtle="Delivering to buyers" />

              <section className="tc-quick-panel">
                <h3>{t.quick}</h3>
                <button onClick={() => {setShowProductForm(true);setNotice("");}}><Plus />{t.add}</button>
                <button onClick={() => go("Marketplace")}><Store />{t.marketplace}</button>
                <button onClick={() => go("Logistics")}><Truck />{t.track}</button>
                <button onClick={() => go("FPO Network")}><Users />{t.manage}</button>
              </section>

              <section className="tc-weather">
                <div className="tc-weather-top"><span>🌤️</span><div><strong>32°C</strong><p>{t.weather}</p><small><MapPin size={12} /> Nashik, Maharashtra</small></div></div>
                <div className="tc-tip"><strong><Sprout size={17} /> {t.tip}</strong><p>{t.tipText}</p><span>🌱</span></div>
              </section>

              <section className="tc-tools-panel">
                <h3>Farmer tools</h3>
                <button onClick={() => setNotice("AI quality grading is a demo placeholder for now.")}><Camera />{t.grading}<ArrowUpRight /></button>
                <button onClick={() => setNotice("Smart pricing is a demo placeholder for now.")}><Sparkles />{t.pricing}<ArrowUpRight /></button>
                <button onClick={() => setNotice("QR traceability is a demo placeholder for now.")}><QrCode />{t.trace}<ArrowUpRight /></button>
              </section>
            </aside>
          </section>

          <footer className="tc-footer">© 2026 TraceCrop · {t.demoNotice}</footer>
        </div>
      </main>


      
  {showProductForm && (
    <div
      className="tc-product-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setShowProductForm(false);
        }
      }}
    >
      <form
        className="tc-product-form"
        onSubmit={handleProductSubmit}
      >
        <div className="tc-product-form-header">
          <div>
            <h2>List New Produce</h2>
            <p>Add your harvest details below.</p>
          </div>

          <button
            type="button"
            className="tc-product-close"
            onClick={() => setShowProductForm(false)}
            aria-label="Close form"
          >
            <X size={22} />
          </button>
        </div>

        <label htmlFor="product-name">Product Name</label>
        <input
          id="product-name"
          name="name"
          value={productForm.name}
          onChange={handleProductFieldChange}
          placeholder="e.g. Tomatoes"
          required
        />

        <label htmlFor="product-quantity">Quantity (kg)</label>
        <input
          id="product-quantity"
          name="quantity"
          type="number"
          min="0.01"
          step="any"
          value={productForm.quantity}
          onChange={handleProductFieldChange}
          placeholder="e.g. 100"
          required
        />

        <label htmlFor="product-price">Price per kg (₹)</label>
        <input
          id="product-price"
          name="price"
          type="number"
          min="0.01"
          step="any"
          value={productForm.price}
          onChange={handleProductFieldChange}
          placeholder="e.g. 30"
          required
        />

        <label htmlFor="product-harvest-date">Harvest Date</label>
        <input
          id="product-harvest-date"
          name="harvestDate"
          type="date"
          value={productForm.harvestDate}
          onChange={handleProductFieldChange}
          required
        />

        <label htmlFor="product-location">Farm / Village Location</label>
        <input
          id="product-location"
          name="location"
          value={productForm.location}
          onChange={handleProductFieldChange}
          placeholder="e.g. Prayagraj"
          required
        />

        <div className="tc-product-form-actions">
          <button
            type="button"
            className="tc-product-cancel"
            onClick={() => setShowProductForm(false)}
          >
            Cancel
          </button>

          <button type="submit" className="tc-product-submit">
            Save Produce
          </button>
        </div>
      </form>
    </div>
  )}

      
   
   
   
   
    </div>
  );
}
