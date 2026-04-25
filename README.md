# Nutrition Tracker

The Nutrition Tracker is a comprehensive web application designed to help users manage their dietary habits, track meals, and achieve their health goals. Built with modern web technologies, it offers a seamless and user-friendly experience with a focus on internationalization, security, and performance.

## Features

### 1. User Authentication
- Secure user authentication using `next-auth`.
- Login, signup, and password reset functionalities.
- Email verification with secure token-based confirmation.

### 2. Meal Tracking
- Log meals with detailed nutritional information, including calories, protein, carbs, and fat.
- Parse meal data to calculate total nutritional values.
- Dropdown options for meal types (e.g., Breakfast, Lunch, Snack) with translations.

### 3. User Profile Management
- Set and update personal details such as age, weight, height, and activity level.
- Define health goals (e.g., Maintain, Lose Weight, Gain Muscle).
- Automatic calculation of macro targets based on user profile and goals.

### 4. Dashboard Insights
- Visualize daily and weekly nutritional summaries using `Recharts`.
- Macro distribution donut chart and single metric charts for detailed insights.
- Personalized insights generated based on user data.

### 5. History and Trends
- View historical data of logged meals and nutritional trends.
- Interactive charts to track progress over time.

### 6. Internationalization (i18n)
- Fully localized application using `next-intl`.
- Supports multiple languages (e.g., English, Greek).
- Locale-aware routing and translations for all UI elements.

### 7. Security
- Comprehensive security headers configured in `next.config.ts`.
- CSRF protection for all sensitive operations.
- Secure password hashing using `bcryptjs`.

### 8. Responsive Design
- Mobile-first design with `Tailwind CSS`.
- Optimized for various screen sizes and devices.

### 9. API
- RESTful API endpoints for user authentication, meal logging, profile management, and more.
- Built with Next.js API routes and Prisma ORM.

## Technologies Used

- **Next.js**: Framework for server-side rendering and static site generation.
- **TypeScript**: Ensures type safety and better developer experience.
- **Prisma**: ORM for database management with PostgreSQL.
- **PostgreSQL**: Relational database for storing user and meal data.
- **next-intl**: Handles internationalization and locale-aware routing.
- **Tailwind CSS**: Utility-first CSS framework for responsive design.
- **Recharts**: Library for creating interactive charts and data visualizations.
- **next-auth**: Authentication library for secure user login and session management.
- **Resend**: Email delivery service for email verification and password reset.
- **Zod**: Schema validation for form data.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/nutrition-tracker.git
   cd nutrition-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`.
   - Update the environment variables with your configuration (e.g., database URL, email service credentials).

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Folder Structure

- `app/`: Contains the main application pages and layouts.
- `api/`: API routes for handling backend logic.
- `components/`: Reusable React components, including charts and forms.
- `i18n/`: Internationalization utilities and configurations.
- `lib/`: Helper functions and utilities (e.g., calculations, email handling, CSRF protection).
- `messages/`: Translation files for supported languages.
- `prisma/`: Database schema and migrations.
- `public/`: Static assets such as images and flags.
- `types/`: TypeScript type definitions.

## Deployment

The application can be deployed on [Vercel](https://vercel.com/) for seamless hosting and scaling. Follow the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for detailed instructions.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License.
