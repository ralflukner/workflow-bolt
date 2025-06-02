# Patient Flow Management (Vite + React + TypeScript)

This project is a **Patient Flow Management** dashboard built with
[Vite](https://vitejs.dev/), [React](https://react.dev/),
[TypeScript](https://www.typescriptlang.org/), and
[Tailwind CSS](https://tailwindcss.com/).
It provides a modern, interactive
interface for managing patient appointments and flow in a clinical setting.

## Features

- **Secure Authentication**: Auth0-powered login with protected routes
- **Dashboard**: Visualize and manage patients through various stages
  (Scheduled, Arrived, Appointment Prep, Ready for MD, With Doctor,
  Seen by MD, Completed)
- **Real-time Updates**: Live patient status tracking with configurable
  time simulation
- **Metrics Panel**: View key metrics about patient flow and clinic
  efficiency
- **Time Control**: Adjust and simulate time for workflow testing and
  training
- **Patient Management**: Add new patients and import schedules in bulk
- **Export Capabilities**: Generate reports in text and CSV formats
- **Responsive Design**: Optimized for desktop and mobile devices

## Tech Stack

- [Vite 5.0.0](https://vitejs.dev/) (build tool optimized for React
  compatibility)
- [React 18.3.1](https://react.dev/) (UI library)
- [TypeScript 5.5.3](https://www.typescriptlang.org/) (type safety)
- [Tailwind CSS 3.4.1](https://tailwindcss.com/) (utility-first CSS)
- [Auth0 2.3.0](https://auth0.com/) (authentication)
- [Lucide React](https://lucide.dev/) (icons)

> **Note**: You may see a moderate severity npm audit warning about esbuild.
> This is a false positive as we're using Vite 5.0.0 which includes a newer,
> secure version of esbuild.
> The warning can be safely ignored.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd <repo-directory>
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

### Development

To start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)
(or as indicated in your terminal).

### Build for Production

To build the app for production:

```bash
npm run build
```

The output will be in the `dist` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

### Deploying to Netlify

This project is configured for easy deployment to
[Netlify](https://www.netlify.com/):

1. **Create a Netlify account** if you don't have one already.

2. **Deploy to Netlify** using one of these methods:

   - **Git Integration (Recommended)**: Connect your GitHub/GitLab/Bitbucket
     repository to Netlify for continuous deployment.
   - **Manual Deploy**: Run `npm run build` locally and drag-and-drop the
     `dist` folder to Netlify's manual deploy area.
   - **Netlify CLI**: Install the Netlify CLI
     (`npm install -g netlify-cli`) and run `netlify deploy`.

3. **Configure environment variables** in the Netlify UI:

   - Go to Site settings > Build & deploy > Environment
   - Add the following variables:

     ```env
     VITE_AUTH0_DOMAIN=your-auth0-domain.region.auth0.com
     VITE_AUTH0_CLIENT_ID=your-auth0-client-id
     VITE_AUTH0_REDIRECT_URI=https://your-netlify-site-name.netlify.app
     VITE_AUTH0_AUDIENCE=https://api.patientflow.com
     VITE_APP_NAME=Patient Flow Management
     ```

   - Replace the placeholders with your actual values:
     - `your-auth0-domain.region.auth0.com`: Your Auth0 domain from your
       Auth0 account
     - `your-auth0-client-id`: Your Auth0 client ID from your Auth0 account
     - `your-netlify-site-name.netlify.app`: Your actual Netlify domain

   > **Important**: You must create your own Auth0 account
   > and application to get the necessary credentials.
   > Never use shared or example
   > credentials in a production environment.

4. **Update Auth0 configuration**:

   - Log in to your [Auth0 Dashboard](https://manage.auth0.com/)
   - Go to Applications > Your Application > Settings
   - Add your Netlify domain to "Allowed Callback URLs",
     "Allowed Logout URLs", and "Allowed Web Origins"

The project already includes a `netlify.toml` file with the necessary
build settings and redirect rules for the SPA.

### Linting

To run ESLint:

```bash
npm run lint
```

## Project Structure

```text
├── src/
│   ├── auth/              # Auth0 authentication configuration
│   ├── components/        # React components (Dashboard, PatientList, etc.)
│   ├── context/           # React context providers (Time, Patient)
│   ├── data/              # Static or mock data
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Tailwind CSS imports
├── docs/                  # Comprehensive documentation
├── public/                # Static assets (if any)
├── index.html             # HTML template
├── package.json           # Project metadata and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── tsconfig*.json         # TypeScript configuration
```

## License

Specify your license here (e.g., MIT, Apache-2.0, etc.).

---

_This project was bootstrapped with [Vite](https://vitejs.dev/)._

---

_(Content below was moved from `docs/README.md`)_

## Documentation

This directory contains comprehensive documentation for the Patient Flow
Management application.

### Documentation Index

- [Project Overview](docs/overview.md) - Introduction to the project and its
  goals
- [Architecture](docs/architecture.md) - System architecture and technology
  choices
- [Data Model](docs/data-model.md) - Data structures and state management
- [Component Design](docs/component-design.md) - UI component overview and
  interaction patterns
- [Authentication](docs/auth.md) - Auth0 authentication implementation
- [Recent Changes](docs/recent-changes.md) - Documentation of recent
  significant changes
- [Setup Guide](docs/setup-guide.md) - Instructions for setting up the
  development environment

_Note: Links above have been updated to point to the `docs/` directory._

### Quick Start

For quick setup instructions, refer to the main content in the project root.
_(Note: This is now part of the main README)._

### Contributing

When making changes to the codebase, please update the relevant documentation
in the `docs/` directory to keep it current.
