
const HttpError = require('../models/http-error');
const Room = require('../models/room');


// const ROOMS = [
//     {rId: '1', rName: 'Ayalguu', rHost: 'Basu'}
// ];

// Get rooms
const getRooms = async (req, res, next) => {
   const room = await Room.find()
   res.json({room: room.map(r => r.toObject({ getters: true })) });
};

// Get a room by id
const getRoomById = async(req, res, next) => {
    const roomId = req.params.rid;

    let room;
    try {
        room = await Room.findById(roomId); console.log('rroomm: ', room)
    } catch(err){
        const error = new HttpError('Could not fetch room data for provided id, please try again later!', 500)
        return next(error)
    }
    
    res.json({ room: room.toObject({ getters: true })})

}

// Create room
const createRoom = async (req, res, next) => {
    const {rName, rHost, avatarSrc } = req.body;

    if(!rName || !rHost){
        return res.status(400).json({ message: "Missing room name or host"})
    }
    const createdRoom = new Room({
        rName,
        rHost,
        avatarSrc,
        players: [{ name: rHost, avatarSrc, score: 0}]
    });

    try {
        await createdRoom.save();
        console.log("created room:", createdRoom)
        // Initialize in-memory room messages and players if not exists
        // if(!rooms[createdRoom.id]) rooms[createdRoom.id] = {message: [], players: []}
    } catch (err) {
        const error = new HttpError('Failed to create new room. Please try again! This is Backend', 500);
        return next(error);
    }  
  
    // res.status(201).json(createdRoom)
    res.status(201).json({ room: createdRoom.toObject({ getters: true })})
};

// Join room
const joinRoom = async (req, res, next) => {
    const io = req.io;
    const { playerName, avatarSrc } = req.body;

    const roomId = req.params.rid;

    try {
        // find room
        const room = await Room.findById(roomId);
        if(!room) {
            return next(new HttpError('Room not found', 404 ));
        }
console.log(`Joining room ${roomId} 'Current players: ${room.players}`)

        // Preventing duplicate joining
        const alreadyJoined = room.players.some(p => p.name === playerName);
        if (alreadyJoined){
            return res.json({ room: room.toObject({ getters: true })})
        }

        // Check capacity
        if(room.players.length >= 5){
           return res.status(400).json({ message: 'Room is full' })
        
        }

        // add player to room
        room.players.push({ name: playerName, avatarSrc, score: 0});
        await room.save();

        res.json({ room: room.toObject({ getters: true })})
        
        io.to(roomId).emit('playerJoined', room.toObject({ getters: true }));

    } catch (err) {
        console.error('Join room failed: ', err)
        const error = new HttpError('Joining room failed. ( this is from backend)', 500)
        return next(error)
    }
};

// Delete player by id
const deletePlayer = async (req, res, next) => {
    const playerId =  req.params.pid;
    const roomId = req.params.rid;
    
    try {
        // Find the room
        const room = await Room.findById(roomId);
        if(!room) {
            return res.status(404).json({ message: 'Room not found! '})
        }
        console.log('room - to delete a player: ', room);

        // Find if player exists
        const playerIndex = room.players.find(p => p._id.toString() === playerId);
        if(playerIndex === -1) {
            return res.status(404).json(({ message: 'Player not found in room. '}))
        }

        // Remove the player
        room.players.splice(playerIndex, 1)

        // Save updated room
        await room.save();

        console.log('Room after deletion: ', room.players)

        // Return 
        res.status(200).json({ 
            message: 'Player deleted!', 
            players: room.players
        })
    } catch(err) {
        console.error('ERROR / room - to delete a player:', err.message)
    }
}

// Reset score - NOT IN USE
const resetGame = async (req, res, next) => {
    const playerId =  req.params.pid;
    const roomId = req.params.rid;
    
    try {
        // Find the room
        const room = await Room.findById(roomId);
        if(!room) {
            return res.status(404).json({ message: 'Room not found! '})
        }
        console.log('room - to delete a player: ', room);

        // Find if player exists
        const playerIndex = room.players.find(p => p._id === playerId);
        if(playerIndex === -1) {
            return res.status(404).json(({ message: 'Player not found in room. '}))
        }

      
        room.players.forEach(player => {player.score = 0});
        room.gameStarted = false;
        room.turnPlayer = null

        // Save updated room
        await room.save();
        console.log('Room after reset: ', room)
        console.log('Room after reset: ', room.players)

        // Return 
        res.status(404).json({ 
            message: 'Player deleted!', 
            players: room.players
        })
    } catch(err) {
        console.error('ERROR / room - to reset room:', err.message)
    }
}

// Delete room
const deleteRoom = async (req, res, next) => {
    const roomId = req.params.rid;
    let room;
    try {
        room = await Room.findById(roomId);
        console.log('olson', roomId)
    } catch (err) {
        const error = new HttpError('Something went wrong. Try again! ', 500)
        return next(error)
    }


    try {
        await room.deleteOne();
    } catch (err) {
        const error = new HttpError('Failed to delete. Try again! ', 500)
        return next(error)
    }
    
    console.log('deleted', roomId)
    res.status(200).json({ message: 'Deleted room'})
    
}

exports.createRoom = createRoom;
exports.joinRoom = joinRoom;
exports.getRooms = getRooms;
exports.getRoomById = getRoomById;
exports.resetGame = resetGame;
exports.deletePlayer = deletePlayer;
exports.deleteRoom = deleteRoom;