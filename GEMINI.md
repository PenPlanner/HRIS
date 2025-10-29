# GEMINI.md

## Project Overview

This is a Next.js web application for a Human Resources Information System (HRIS) designed for Vestas. The application is built with TypeScript, Tailwind CSS, and shadcn/ui, and it aims to manage technicians, service vehicles, and training programs.

The key features of this application include:

*   **Technician Management:** A comprehensive module to manage technician data, including a competency matrix for skills assessment.
*   **Vehicle Fleet Management:** An overview of the service vehicle fleet, with assignments to technicians.
*   **Admin Panel:** A dedicated interface for managing teams, courses, and other system settings.
*   **Dashboard:** A dashboard with various statistics, charts, and real-time updates.
*   **PWA Support:** The application is designed as a Progressive Web App (PWA) for offline access and better performance.
*   **Supabase Integration:** While currently using mock data and localStorage, the application is prepared for integration with Supabase for the database, authentication, and storage.

## Building and Running

To get the project up and running, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

3.  **Build for Production:**
    ```bash
    npm run build
    ```

4.  **Start the Production Server:**
    ```bash
    npm run start
    ```

5.  **Lint the Code:**
    ```bash
    npm run lint
    ```

## Development Conventions

*   **Framework:** The project is built with Next.js 15 and uses the App Router.
*   **Styling:** Styling is done using Tailwind CSS, with a set of UI components from shadcn/ui.
*   **State Management:** React Hook Form is used for form handling, with Zod for schema validation.
*   **Language:** The entire codebase is written in TypeScript.
*   **Backend:** The application is designed to work with Supabase, and the database schema is already defined in the `supabase/migrations` directory.
*   **Code Structure:** The project follows a modular structure, with a clear separation of concerns between components, libraries, and API routes.
