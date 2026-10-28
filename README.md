# 🌱 TraceCrop — From Farm to Customer, Smarter

**An AI-powered agricultural marketplace connecting farmers, FPOs, and customers through transparent pricing, quality insights, and traceable produce.**

TraceCrop is a digital agricultural platform designed to make the journey from farm to customer more transparent, efficient, and accessible. It brings farmers, Farmer Producer Organizations (FPOs), and customers onto a common platform, helping farmers reach more buyers while making fresh produce easier to discover, purchase, and trace.

Built with a focus on practical agricultural challenges, TraceCrop combines a digital marketplace with AI-assisted tools, logistics coordination, and produce traceability.

## 🌾 The Problem We're Solving

Agricultural supply chains often involve multiple intermediaries between farmers and consumers. This can create challenges for both sides.

- **Limited market access:** Farmers may struggle to reach customers and bulk buyers beyond their local markets.
- **Uncertain pricing:** Farmers may lack accessible tools to compare market rates and determine fair prices for their produce.
- **Quality assessment challenges:** Consistent produce grading can be difficult without accessible quality-assessment tools.
- **Logistics inefficiencies:** Collecting produce from multiple farmers and fulfilling orders efficiently can be challenging.
- **Limited transparency:** Customers may have difficulty discovering where their produce came from and understanding its journey.
- **Digital accessibility barriers:** Farmers who are unfamiliar with smartphone applications may face difficulties using digital platforms.

These challenges can affect farmers' earnings, increase operational inefficiencies, and make the agricultural supply chain less transparent.

## 💡 Our Solution

TraceCrop aims to connect the key participants in the agricultural supply chain through a single digital platform.

Instead of treating farmers, FPOs, logistics providers, and customers as disconnected participants, TraceCrop brings their workflows together.

- Farmers can list their produce and manage availability.
- FPOs can coordinate produce collection and bulk orders.
- AI-assisted tools can support quality assessment and pricing decisions.
- Logistics tools can help group orders and plan delivery routes.
- Customers can discover produce and follow its traceability information.

**Our goal:** Help farmers access more buyers, support fairer and more informed pricing, reduce avoidable supply-chain inefficiencies, and build trust between producers and customers.

## ✨ Key Features

### 👨‍🌾 1. Farmer Dashboard
A dedicated workspace for farmers to manage their produce and marketplace activity.

- Produce listings and inventory management
- Price and quantity information
- Harvest date and location details
- Order visibility and management

### 🤖 2. AI-Powered Quality Grading
AI-assisted image classification designed to help assess the quality of agricultural produce.

- Analyze produce images using an image-classification model
- Support produce quality categorization
- Help farmers communicate product quality to potential buyers

### 💰 3. Smart Pricing Assistance
Pricing support intended to help farmers make more informed selling decisions.

- Market-rate information
- AI-assisted price suggestions
- Improved price transparency for buyers and sellers

### 🏢 4. FPO Coordination
Support for Farmer Producer Organizations that collect produce from multiple farmers.

- Coordinate farmer produce listings
- Support bulk-produce management
- Help organize supply for larger orders

### 📦 5. Order Grouping
Group compatible orders to support more efficient fulfilment and reduce unnecessary trips.

### 🗺️ 6. Route Planning
Map-based logistics support intended to help plan efficient collection and delivery routes.

### 🔎 7. QR-Based Produce Traceability
QR-code-based traceability intended to connect a produce item or listing with its available origin and product information.

- Access product details through a QR code
- Improve visibility into produce origin and handling information
- Support greater transparency between farmers and customers

### 🛒 8. Customer Marketplace
A customer-facing marketplace designed to make fresh produce easier to discover and purchase.

- Browse agricultural products
- Search and explore available produce
- View prices, quantities, and farmer/FPO information
- Manage a shopping cart and orders

### 🎙️ 9. Voice-Based Accessibility
A planned accessibility feature intended to help farmers interact with the platform using voice input, including Hindi-language interaction.

### 📱 10. Mobile-First Interface
A responsive, accessible interface designed with agricultural users and practical on-the-ground use in mind.

## 🔄 How TraceCrop Works

**Farmer → FPO → TraceCrop Intelligence → Logistics → Customer**

1. **Farmers list produce:** Farmers provide product details, quantities, prices, harvest dates, and locations.
2. **FPOs coordinate supply:** FPOs help aggregate produce and organize bulk supply.
3. **AI assists decision-making:** Quality assessment and pricing tools support more informed marketplace decisions.
4. **Orders are organized:** Order grouping and route-planning tools aim to improve collection and delivery efficiency.
5. **Customers discover produce:** Customers browse products and place orders through the marketplace.
6. **Produce information is traceable:** QR codes can provide access to available product and origin information.

## 👥 Who Benefits?

| Stakeholder | Intended benefit |
|---|---|
| Farmers | Wider buyer access, improved price visibility, and easier produce management |
| FPOs | Better coordination of farmer supply and bulk orders |
| Customers | Easier produce discovery, product information, and traceability |
| Logistics operators | Better-organized collections and delivery routes |

## 🛠️ Technology Stack

**Frontend**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Leaflet and React Leaflet
- Motion

**Backend**
- Node.js and TypeScript
- Express.js
- MongoDB integration through Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- Multer
- dotenv and CORS

**AI and Other Tools**
- Google GenAI SDK
- QRCode React
- Image-classification model integration, where configured

## 🚀 Getting Started

### Prerequisites
- Node.js and npm
- MongoDB, if required by the configured application
- API credentials for any external AI services being used

### Installation

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd YOUR_PROJECT_FOLDER
npm install
```

Create your `.env` file using `.env.example` and supply the environment variables required by the application.

Start the development server:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

Run the available type-checking command:

```bash
npm run lint
```

The development command runs `server.ts` using `tsx`. Refer to the server configuration for the actual port and available endpoints.

## 🔐 Security and Responsible Development

- Keep API keys and database credentials out of version control.
- Hash passwords and protect authenticated routes.
- Validate uploaded files and user-submitted data.
- Display traceability information only when it is available and supported by the underlying data.
- Treat AI-generated quality classifications and price suggestions as decision-support tools rather than guaranteed assessments.

## 🚧 Project Status

TraceCrop is an evolving hackathon project. Its features are being developed and tested iteratively.

The feature descriptions above explain the project's intended capabilities. Their availability in the current build depends on the implementation and configuration of the application.

## 🌍 Our Vision

We envision a more connected agricultural ecosystem in which farmers can reach buyers more easily, FPOs can coordinate supply efficiently, customers can make informed purchasing decisions, and produce can move through a more transparent supply chain.

**TraceCrop — Connecting farms, empowering farmers, and building trust from farm to customer.**

