# 🥗 Nutrition Tracker

**A full-stack nutrition tracking web app built with modern Next.js and AI technologies.**

Nutrition Tracker is a professionally engineered project that combines secure user authentication, multilingual support, AI-powered meal parsing, configurable nutrition goals, historical analytics, and a responsive design system.

---

## 🚀 Project Overview

This app is designed to help users log meals, estimate nutrition intake automatically, and track progress day-by-day and week-by-week.

Key capabilities include:
- AI-powered meal analysis in English and Greek
- Full biometric profile and nutrition target calculation
- Secure authentication, email verification, password reset, and account deletion
- Daily dashboard, meal history, and weekly insights
- Responsive mobile-first user interface with charts
- Custom security and localization middleware

---

## 🧩 Core Features

### 📊 Dashboard & Insights
- Daily calories, protein, carbs, and fat summary
- Progress tracking against personalized goals
- Macro distribution charts and weekly trends
- Contextual nutrition insights based on logged data

### 🍽️ Meal Logging & AI Parsing
- Manual meal entry with individual food items
- AI-powered meal parsing that extracts food names, quantities, and nutrition values
- Edit parsed meal items before saving
- Support for Greek and English meal descriptions

### 👤 User Account Management
- Email/password authentication with NextAuth
- Email verification flow with transactional email
- Profile onboarding and goal calculation
- Password change with current password validation
- Secure account deletion and sign-out

### 📅 History & Tracking
- Browse meal history with date filtering
- Compare trends across the last 7 days
- Store and review past meals and nutrition totals

---

## 🛠 Technologies & Tools

This repo uses:

- **Next.js 16** with the App Router
- **React 19** and **TypeScript** for type-safe UI
- **Tailwind CSS v4** and **PostCSS** for styling
- **Prisma 7.7** with **PostgreSQL** via `pg`
- **NextAuth v5** with credentials authentication and JWT session strategy
- **next-intl** for locale-based routing and translation
- **Recharts** for dashboard charts
- **OpenAI** and **Google Gemini** generative AI for nutrition parsing
- **Resend** for transactional email delivery
- **Upstash Rate Limit** for AI endpoint protection
- **Zod** and `@hookform/resolvers` for validation
- **bcryptjs** for secure password hashing
- **date-fns** for date utilities
- **ESLint** for code quality

---

## 🔒 Security & Implementation Details

### Authentication & session handling
- Custom NextAuth configuration in `auth.config.ts`
- Route-level authorization and protected page redirection
- JWT session strategy with session enrichment in `auth.ts`
- Sign-out forced after account deletion to prevent stale auth loops

### CSRF protection
- Custom CSRF token system via `lib/csrf.ts`
- CSRF endpoint under `/api/csrf`
- Token stored in a secure cookie and validated on state-changing API requests
- Client-side CSRF fetches include `credentials: include`

### Validation & sanitization
- Input validation with Zod schemas in `lib/validators.ts`
- Request sanitization using `lib/sanitize.ts`
- Strong API error handling for invalid JSON and payload issues

### Email & verification
- Email verification workflow with `/api/verify-email`
- Password reset request and confirmation endpoints
- Transactional emails powered by Resend

---

## 🤖 AI & Meal Parsing

### AI pipeline
- Primary AI engine: **Azure OpenAI** via `lib/azure-openai.ts`
- Fallback engine: **Google Gemini** via `lib/gemini.ts`
- Locale-aware prompt handling for Greek (`el`) and English (`en`)
- Multi-key Gemini key rotation and fallback handling
- Retry logic for transient AI errors and quota exhaustion

### Meal parsing endpoint
- `/api/meals/parse` performs AI parsing and schema validation
- Rate limiting with Upstash to prevent abuse
- Sanitizes user meal text before sending it to AI
- Returns validated JSON with meal items and macros

---

## 🌍 Localization & Hidden Techniques

This project includes deep multilingual support and several advanced hidden techniques:

- Route-based locale segments under `app/[locale]/...`
- English and Greek translation files at `messages/en.json` and `messages/el.json`
- Locale-aware middleware in `proxy.ts` that redirects `/` to `/en` and enforces `/en` or `/el` routes
- Custom auth middleware combined with `next-intl` for locale routing and protected pages
- Language switcher in the UI with dynamic translation loading
- Secure locale handling for both navigation and API responses

Hidden or non-obvious implementations:
- Custom CSRF validation for all state-changing API routes
- Account deletion flow that signs out a deleted user and redirects cleanly
- Automatic goal calculation from profile data using `lib/calculations.ts`
- Nutrition insights generation in `lib/insights.ts`
- Health check endpoint `/api/health/db`
- Custom `types/next-auth.d.ts` extensions for typed session/user data

---

## 📁 Project Structure

Important folders and files:

- `app/` – Next.js App Router pages and locale routes
- `app/api/` – server API routes for auth, profile, meals, history, account management
- `components/` – reusable UI components, forms, charts, dashboard widgets
- `lib/` – shared backend utilities, AI clients, validators, CSRF, email, env, rate limiting
- `messages/` – translation JSON files for `en` and `el`
- `prisma/` – Prisma schema and database migrations
- `types/` – custom TypeScript type definitions

---

## ✅ Why this project stands out

This repository is not just a simple nutrition tracker. It is a complete full-stack solution that integrates AI, multilingual UX, security best practices, modern styling, and analytics.

It demonstrates:
- professional architecture with Next.js App Router
- secure auth and CSRF protection
- intelligent AI fallback handling
- advanced locale routing and translation strategy
- reusable component design and responsive layout