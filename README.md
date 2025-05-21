# Reddit Clone Project

This project is a clone of Reddit, built with a React frontend and an Express.js backend.

## Project Structure

- `reddit-clone-frontend/`: Contains the React frontend application.
- `reddit_clone/reddit-clone-backend/`: Contains the Express.js backend application.

## Prerequisites

- Node.js (v16 or later recommended)
- npm
- PostgreSQL

## Setup and Running

### 1. Backend (Express.js)

The backend server runs on port 3001 by default.

1.  **Navigate to the backend directory:**
    ```bash
    cd reddit_clone/reddit-clone-backend
    ```

2.  **Create a `.env` file:**
    Copy the example below and fill in your PostgreSQL details.
    ```env
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=your_db_name
    DB_HOST=localhost
    DB_PORT=5432
    NODE_ENV=development
    PORT=3001
    JWT_SECRET=yoursupersecretjwtkey
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Set up the database:**
    Ensure your PostgreSQL server is running. Then, run the migrations:
    ```bash
    npx sequelize-cli db:create # Only if the database doesn't exist yet
    npx sequelize-cli db:migrate
    ```
    *(Note: `db:create` might require user permissions to create databases, or you might need to create it manually using `createdb -U your_db_user your_db_name` before migrating).*

5.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The backend API will be available at `http://localhost:3001`.

### 2. Frontend (React)

The frontend development server runs on port 3000 by default and proxies API requests to the backend on port 3001.

1.  **Navigate to the frontend directory:**
    ```bash
    cd reddit-clone-frontend
    ```
    *(If you are in the backend directory, you can use `cd ../../reddit-clone-frontend`)*

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm start
    ```
    The application will open automatically in your browser at `http://localhost:3000`.

## API Endpoints

The backend exposes various API endpoints under `/api`. Refer to the route definitions in `reddit_clone/reddit-clone-backend/src/routes/` for details.
