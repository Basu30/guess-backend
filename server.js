const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');


const HttpError = require('./models/http-error');
const mongoose = require('mongoose');

const socketController = require('./socket/socketController')

const roomRoutes = require('./routes/room-routes');
const userRoutes = require('./routes/user-routes');

const app = express();

// CORS & JSON early
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json());

// Add Railway-friendly home route
app.get('/', (req, res) => {
  res.send("Guess The Song backend is running!")
});

// --- Creating shared server ---
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: '*'} });


// Attach io to req for controllers
app.use((req, res, next) => {
  req.io = io;
  next()
})

// REST API routes
app.use('/api', roomRoutes);
app.use('/api/users', userRoutes);


// 404 handler
app.use(( req, res, next) => {
  res.status(404).json({message: "Route not found"})
});

// Error handler
app.use((error, req, res, next) => {
    if(res.headersSent) {
      return next(error)
    };

    res.status(error.code || 500).json({ message: error.message || 'Unknown error!!!' });
})


// Attach Socket.io 
socketController(io);


// Database + start server
const port = process.env.PORT || 5000;

mongoose
  .connect('mongodb+srv://basuSong:BilguunSong@cluster0.4qmc5.mongodb.net/guess-song?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('MongoDB connected');

    server.listen(port, '0.0.0.0', () => {
        console.log(`Backend + Socket.IO server running on port: ${port}`)
    });
  })
  .catch((err) => {
    console.log('MongoDB connection error: ', err.message)
  });

