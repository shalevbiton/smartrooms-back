
# MySQL Integration Guide

Because this is a **React (Frontend)** application, it cannot connect directly to MySQL for security reasons. To use the schema provided in `schema.sql`, you must set up a backend API.

## Recommended Architecture

1.  **Database:** MySQL (Run the `schema.sql` script to create tables).
2.  **Backend API:** Node.js (Express), Python (FastAPI/Flask), or Go.
3.  **Frontend:** This React App.

## Steps to Implement

1.  **Set up MySQL:**
    *   Install MySQL Server.
    *   Create a database: `CREATE DATABASE smartroom;`
    *   Run the contents of `database/schema.sql` to generate tables and seed data.

2.  **Create a Backend (Example using Node.js/Express):**
    *   Initialize a new project: `npm init -y`
    *   Install drivers: `npm install express mysql2 cors`
    *   Create an endpoint to fetch rooms:
    
    ```javascript
    // server.js example
    const express = require('express');
    const mysql = require('mysql2');
    const cors = require('cors');
    const app = express();
    
    app.use(cors()); // Allow React to connect
    app.use(express.json());

    const db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'smartroom'
    });

    // API Endpoint: Get All Rooms
    app.get('/api/rooms', (req, res) => {
        const sql = `
            SELECT r.*, GROUP_CONCAT(re.item_name) as equipment 
            FROM rooms r 
            LEFT JOIN room_equipment re ON r.id = re.room_id 
            GROUP BY r.id
        `;
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json(err);
            // Transform equipment string back to array
            const formatted = results.map(room => ({
                ...room,
                equipment: room.equipment ? room.equipment.split(',') : []
            }));
            res.json(formatted);
        });
    });

    app.listen(3001, () => console.log('Server running on port 3001'));
    ```

3.  **Connect React to Backend:**
    *   Replace the code in `services/mockData.ts` or create a new `api.ts` file to fetch from your new server instead of using static arrays.
    
    ```typescript
    // Example frontend fetch
    export const fetchRooms = async () => {
        const response = await fetch('http://localhost:3001/api/rooms');
        return await response.json();
    };
    ```
