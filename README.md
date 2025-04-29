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