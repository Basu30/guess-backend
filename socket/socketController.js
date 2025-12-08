const Room = require('../models/room');



module.exports = (io) => {

  async function allRooms() {
    const rooms = await Room.find()
    io.emit('roomsUpdated', rooms.map(r => r.toObject({ getters: true })))
  }


  io.on('connection', async (socket) => {
  console.log('Player Connected:', socket.id);

  // All rooms update
  await allRooms();
  

  // // Listen newly created room
  // socket.on('createdRoom', ({roomId, rHost, avatarSrc, score}) => {
  //   socket.join(roomId);
  //      io.emit('roomsCreated', { roomId, rHost, avatarSrc, score });
  // })

  // Join room
  socket.on('joinRoom',  async ({roomId, playerName, avatarSrc}) => {

    socket.join(roomId);
    socket.playerName = playerName;

    console.log(`Player ${playerName} joined room ${roomId}`);

    // Confirm to the joining a player
     socket.emit('joinedRoom', {roomId, playerName});

    // Notify others in the room
    io.to(roomId).emit('message',{
      text: `${playerName} joined`, 
      name: 'System'});

    // Fetch updated room from DB
    try {
      const room = await Room.findById(roomId)
      if(!room) return;

      if(room.players.length >= 5){
        socket.emit('errorMessage', {msg: 'Room is full (Max 5 players).'});
        return;
      }
      
      // Check if player already exists
        const exists = room.players.some(p => p.name === playerName);

      // If player does NOT exist → add to MongoDB
        if (!exists) {
            room.players.push({
                name: playerName,
                avatarSrc,
                score: 0
            });
            await room.save();
        }
      
      io.to(roomId).emit('playerJoined', room.toObject({ getters: true }));

      // if player joins, refresh room list for everyone
      await allRooms()

    } catch (err) {
      console.error('Error fetching room for Socket.IO: ', err.message)
    }

  });

  //Update score
  socket.on('scoreUpdated', async ({ roomId, playerName, points }) => {
    try {
      const room = await Room.findById(roomId)
      if (!room) return;

      const player = room.players.find(p => p.name === playerName);

      if(player) {
        player.score = (player.score || 0) + points; 
        await room.save();
       
      } else {  // or just player stay with their current score
        player.score = player.score || 0;
        await room.save();
      }
      console.log(`Updated Score ${playerName}: + ${points}` );

      // Automatically turn next Player
      if(room.turnIndex === undefined) room.turnIndex = 0;

      room.turnIndex = (room.turnIndex + 1) % room.players.length;

      const nextPlayer = room.players[room.turnIndex].name;
      room.turnPlayer = nextPlayer;
      await room.save();



      // Send (emit) updated room to everyone
      io.to(roomId).emit('scoreUpdated', { 
        playerName: player.name,
        points: points || null,
        newScore: player.score,
        room: room.toObject({ getters: true })});

      io.to(roomId).emit('nextTurn', {
        room: room.toObject({ getters: true }),
        turnPlayer: nextPlayer
      })

    } catch(err) {
      console.error('Error updating score:', err.message)
    }
  });
 
  // Start Game
  socket.on('startGame', async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) return;

      if(room.gameStarted) {
        return socket.emit('errorMessage', { msg: "Game already started!"})
      }
      
      room.gameStarted = true;

      if(room.players.length > 0){
        room.turnIndex = 0;
        room.turnPlayer = room.players[0].name;
      }

      await room.save()

      io.to(roomId).emit('gameStarted', room.toObject({ getters: true }));

    } catch (err) {
      console.error(err)
    }    
  });

  // Reset Game 
  socket.on('resetGame', async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId);
      if(!room) return;

      //Reset all players' scores
      room.players.forEach(player => {player.score = 0});
      
      // Reset game start
      room.gameStarted = false;
      
      // Reset turn
      room.turnIndex = 0;
      if(room.players.length > 0){
        room.turnPlayer = room.players[0].name;
      }

      await room.save();

      // Broadcast updated to everyone in the room
      io.to(roomId).emit('scoreUpdated', {
        room: room.toObject({ getters: true })
      });

      // Tell everyone to navigate to the Room 
      io.to(roomId).emit('navigateToRoom', {roomId});

      console.log(`Game reset in room ${roomId}`);
    } catch(err) {
      console.error('Error resetting game - socketController', err.message)
    }

   
  })
    

  // Chat message
  socket.on('sendMessage', ({ roomId, text, name, avatarSrc }) => {
    io.to(roomId).emit('message', { text, name, avatarSrc})
  });

  // Who is typing
  socket.on('typing', ({ roomId, playerName }) => {
    socket.to(roomId).emit('userTyping', { playerName })
  });

  // Who is playing
  socket.on('playing', ({roomId, playerName, points, genre, avatarSrc}) => {
    socket.to(roomId).emit('currentPlayer', { playerName, genre, points, avatarSrc})
  })

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id)
  });

  


});

}
