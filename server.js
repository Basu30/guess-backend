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




// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader(
//         'Access-Control-Allow-Headers',
//         'Origin, X-Requested-With, Content-Type, Accept, Authorization')
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

//     next()
// });


// 404 handler
app.use(( req, res, next) => {
    const error = new HttpError('Could not find this route.', 400)
    throw error;
});

// Error handler
app.use((error, req, res, next) => {
    if(res.headersSent) {
      return next(error)
    };

    res.status(error.code || 500).json({ message: error.message || 'An unknown error occurred!!!' });
})


// Attach Socket.io 
socketController(io);


// Database + start server
const port = 5001;

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

