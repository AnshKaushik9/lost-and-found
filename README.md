# 🔍 Lost & Found – Smart Item Recovery System

---

## 📁 Project Structure

```
lost-and-found/
├── backend/
│   ├── models/
│   │   ├── User.js        ← User schema
│   │   ├── Item.js        ← Lost/Found item schema
│   │   └── Message.js     ← Chat messages schema
│   ├── routes/
│   │   ├── auth.js        ← Register, Login, JWT
│   │   ├── items.js       ← Post, Get, Delete items + Image Upload
│   │   ├── chat.js        ← Chat history (Socket.IO)
│   │   └── matches.js     ← Smart matching algorithm
│   ├── middleware/
│   │   └── auth.js        ← JWT verification middleware
│   ├── uploads/           ← Uploaded images (auto created)
│   ├── server.js          ← Main Express + Socket.IO server
│   ├── .env               ← Environment variables
│   └── package.json
│
└── frontend/
    ├── css/
    │   └── style.css      ← All styles
    ├── js/
    │   └── app.js         ← All frontend logic
    └── index.html         ← Main HTML page
```

---

## 🚀 How to Run (Step by Step)

### ✅ Requirements
- Node.js (v16+) → https://nodejs.org
- MongoDB → https://www.mongodb.com/try/download/community
- Any browser (Chrome recommended)

---

### Step 1: Install MongoDB
1. Download MongoDB Community from the link above
2. Install it and start the MongoDB service
3. It runs on `mongodb://localhost:27017` by default

---

### Step 2: Setup Backend

Open terminal/command prompt and run:

```bash
# Go into backend folder
cd lost-and-found/backend
# Install all packages
npm install
# Start the server
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:5000
✅ MongoDB Connected
```

---

### Step 3: Open Frontend

Simply open the file in your browser:

```
lost-and-found/frontend/index.html
```

OR right-click → Open with → Chrome/Browser

---

## ⚙️ Features

| Feature | Technology |
|---------|-----------|
| User Auth | JWT + bcryptjs |
| Item Posting | REST API + Express |
| Image Upload | Multer |
| Real-time Chat | Socket.IO |
| Smart Matching | Custom algorithm |
| Database | MongoDB + Mongoose |
| Frontend | HTML + CSS + Vanilla JS |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| POST | /api/items | Post new item |
| GET | /api/items | Get all items |
| GET | /api/items/:id | Get single item |
| GET | /api/items/user/my | Get my items |
| PUT | /api/items/:id/resolve | Mark resolved |
| DELETE | /api/items/:id | Delete item |
| POST | /api/chat/message | Save message |
| GET | /api/chat/history/:roomId | Get chat history |
| GET | /api/matches/:itemId | Get smart matches |

---

## 🔧 Troubleshooting

**"MongoDB Error"**
→ Make sure MongoDB service is running on your computer

---