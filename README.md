# Patient Flow Management (Vite + React + TypeScript)

This project is a **Patient Flow Management** dashboard built with [Vite](https://vitejs.dev/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/). It provides a modern, interactive interface for managing patient appointments and flow in a clinical setting.

## Features
- **Dashboard**: Visualize and manage patients through various stages (Scheduled, Arrived, Appointment Prep, Ready for MD, With Doctor, Seen by MD, Completed).
- **Metrics Panel**: View key metrics about patient flow.
- **Time Control**: Adjust and simulate time for workflow testing.
- **Patient List**: View and manage patients by status.
- **New Patient Form**: Add new patients to the system.
- **Import Schedule**: Import patient schedules in bulk.
- **Responsive UI**: Works well on desktop and mobile.

## Tech Stack
- [Vite](https://vitejs.dev/) (build tool)
- [React](https://react.dev/) (UI library)
- [TypeScript](https://www.typescriptlang.org/) (type safety)
- [Tailwind CSS](https://tailwindcss.com/) (utility-first CSS)
- [Lucide React](https://lucide.dev/) (icons)

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
The app will be available at [http://localhost:5173](http://localhost:5173) (or as indicated in your terminal).

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

### Linting
To run ESLint:
```bash
npm run lint
```

## Project Structure
```
├── src/
│   ├── components/        # React components (Dashboard, PatientList, etc.)
│   ├── context/           # React context providers
│   ├── data/              # Static or mock data
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Tailwind CSS imports
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

*This project was bootstrapped with [Vite](https://vitejs.dev/).*

---

*(Content below was moved from `docs/README.md`)*

# Patient Flow Management Documentation

This directory contains comprehensive documentation for the Patient Flow Management application.

## Documentation Index

- [Project Overview](docs/overview.md) - Introduction to the project and its goals
- [Architecture](docs/architecture.md) - System architecture and technology choices
- [Data Model](docs/data-model.md) - Data structures and state management
- [Component Design](docs/component-design.md) - UI component overview and interaction patterns
- [Authentication](docs/auth.md) - Auth0 authentication implementation
- [Recent Changes](docs/recent-changes.md) - Documentation of recent significant changes
- [Setup Guide](docs/setup-guide.md) - Instructions for setting up the development environment

*Note: Links above have been updated to point to the `docs/` directory.*

## Quick Start

For quick setup instructions, refer to the main content in the project root. *(Note: This is now part of the main README).*

## Contributing

When making changes to the codebase, please update the relevant documentation in the `docs/` directory to keep it current. 