# HostelApp backend with Express.js and MongoDB
A full-featured REST + WebSocket backend for managing hostels, rooms, messaging and payments—built with Express, MongoDB, Socket.IO & Stripe.

## Features

**Authentication & Authorization**  
  - JWT sign‑up / login  
  - Protected routes via `auth` middleware  

**Resource CRUD**  
  - Guests, Hostels, Rooms, Reservations, Events  

**Payments**  
  - Stripe integration (create payment intents, webhooks)  

**Real‑time Chat**  
  - Socket.IO: join rooms, send/receive messages  

**File Uploads**  
  - Multer storage under `/uploads/{users,hostels,…}`  

**Logging & Monitoring**  
  - Morgan HTTP logs → Winston file logger  

**Security & Headers**  
  - CORS (configurable via `CLIENT_URL`)  
  - Helmet for secure HTTP headers  
  - Rate limiting, cookie‑based sessions 

Note: All write actions require Authorization: Bearer <JWT>

---

## Tech Stack

- **Node.js** & **Express**  
- **MongoDB** (Mongoose ODM)  
- **Socket.IO** for real‑time messaging  
- **Stripe** for payments  
- **Winston** + **Morgan** for logging  
- **dotenv** for environment configuration  
- **Multer** for file uploads  

---

## File Uploads & Static Serving
Multer is configured to store uploads under /uploads/users (and other model-specific folders).

Uploaded files are served statically from `/uploads:`
`GET /uploads/<folder>/<filename>`

---

## WebSocket Chat
Connect to the same Express server via Socket.IO client.
Default origin is `http://localhost:3000` (configurable via CLIENT_URL).

### Events:
- join_room → join a conversation room
- send_message → broadcast a new chat message
- receive_message → listen for incoming messages

---

## Logging
Winston centralizes application logs (info & error) to `logs/hostelapp.log`.

Morgan pipes HTTP request logs into Winston, so all are in one place.

---

## License
This project is licensed under the ISC License. See the LICENSE file for details.