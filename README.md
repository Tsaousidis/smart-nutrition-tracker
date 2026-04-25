# 🥗 Nutrition Tracker

A modern, full-stack web application that helps users **take control of their nutrition** through intelligent tracking, personalized insights, and clean data visualization.

Designed with scalability and user experience in mind, this project combines **robust backend architecture** with a **polished, responsive UI**.

---

## 🚀 Why this project?

Most nutrition apps are either:
- too complex  
- too minimal  
- or locked behind paywalls  

This app focuses on:
- ✔️ **Clarity over clutter**
- ✔️ **Actionable insights (not just raw data)**
- ✔️ **Performance & security by design**
- ✔️ **Full internationalization support**

---

## ✨ Features

### 🔐 Authentication & Security
- Secure authentication via `next-auth`
- Email verification with token-based confirmation
- Password reset flow
- CSRF protection & secure headers
- Password hashing using `bcryptjs`

---

### 🍽️ Smart Meal Tracking
- Log meals with:
  - Calories
  - Protein
  - Carbs
  - Fat
- Automatic macro aggregation per day
- Localized meal types (Breakfast, Lunch, etc.)
- Clean input validation with `Zod`

---

### 👤 Personalized User Profiles
- Store:
  - Age, weight, height
  - Activity level
- Define goals:
  - Maintain weight
  - Lose weight
  - Gain muscle
- 🎯 Auto-calculated macro targets based on profile

---

### 📊 Dashboard & Insights
- Interactive charts powered by `Recharts`
- Daily & weekly summaries
- Macro distribution (donut chart)
- Single-metric breakdowns
- Insight generation based on user behavior

---

### 📈 History & Progress Tracking
- View past meals and nutrition logs
- Track trends over time
- Identify patterns in eating habits

---

### 🌍 Internationalization (i18n)
- Built with `next-intl`
- Multi-language support (e.g., English, Greek)
- Locale-aware routing
- Fully translated UI

---

### 📱 Responsive Design
- Mobile-first approach using `Tailwind CSS`
- Optimized for all screen sizes
- Clean and modern UI

---

### 🔌 API Architecture
- RESTful endpoints via Next.js API routes
- Handles:
  - Authentication
  - Meal tracking
  - Profile management
- Prisma ORM for clean database access

---

## 🛠️ Tech Stack

| Category        | Technology |
|----------------|-----------|
| Framework      | Next.js |
| Language       | TypeScript |
| Database       | PostgreSQL (Neon DB) |
| ORM            | Prisma |
| Auth           | next-auth |
| AI             | Azure OpenAI (GPT-4o) |
| Validation     | Zod |
| Styling        | Tailwind CSS |
| Charts         | Recharts |
| i18n           | next-intl |
| Email Service  | Resend |
| Deployment     | Render |

---

## 📂 Project Structure

- `app/`: Contains the main application pages and layouts.
- `api/`: API routes for handling backend logic.
- `components/`: Reusable React components, including charts and forms.
- `i18n/`: Internationalization utilities and configurations.
- `lib/`: Helper functions and utilities (e.g., calculations, email handling, CSRF protection).
- `messages/`: Translation files for supported languages.
- `prisma/`: Database schema and migrations.
- `public/`: Static assets such as images and flags.
- `types/`: TypeScript type definitions.


---

## ⚙️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/nutrition-tracker.git
cd nutrition-tracker
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Setup environment variables

Create a .env file:

```bash
# Azure OpenAI (for meal parsing)
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT_NAME=

# Database (PostgreSQL - Neon DB)
DATABASE_URL=
DIRECT_URL=

# Authentication
AUTH_SECRET=

# Email (Resend)
RESEND_API_KEY=

# App URL
NEXT_PUBLIC_APP_URL=
DEFAULT_LOCALE=
```

---

### 4. Run database migrations

```bash
npx prisma migrate dev
```

---

### 5. Start the development server

```bash
npm run dev
```

---

## 📄 License

MIT License