/**
 * 1. BACKEND: CORS CONFIGURATION (Node.js/Express)
 * Place this before any routes are defined.
 */
const cors = require('cors');

app.use(cors({
  origin: "http://localhost:5173", // EXACT frontend URL (Vite default is 5173, React is 3000)
  credentials: true                // MUST be true to allow cookies
}));

/**
 * 2. BACKEND: COOKIE SETTINGS (Node.js/Express)
 * Options object for res.cookie in your Login controller.
 */
const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,                    // Security: Prevents JS access to cookie
  secure: isProduction,              // CRITICAL: Must be false on localhost (HTTP)
  sameSite: isProduction ? 'strict' : 'lax', // Lax allows cookie on localhost cross-port
  maxAge: 30 * 24 * 60 * 60 * 1000   // 30 Days in milliseconds
};

// Usage:
// res.cookie('refreshToken', token, cookieOptions);

/**
 * 3. FRONTEND: REQUEST CONFIGURATION (React)
 * Ensure credentials are sent with every auth-related request.
 */

// --- OPTION A: Using Fetch (Standard) ---
// const response = await fetch('http://localhost:3001/auth/me', {
//   method: 'GET',
//   credentials: 'include' // CRITICAL: Tells browser to send/save cookies
// });

// --- OPTION B: Using Axios (Global Config) ---
// import axios from 'axios';
// axios.defaults.withCredentials = true; // Sets it globally for all requests
