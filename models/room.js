const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const roomSchema = new Schema({
    rName: { type: String, required: true },
    rHost: { type: String, required: true },
    avatarSrc: { type: String, },
    players: [
        {
            name: { type: String, required: true},
            avatarSrc: {type: String},
            score: {type: Number, default: 0}
        }
    ], 
    createdAt: {type: Date, default: Date.now},
    gameStarted: { type: Boolean, default: false},
    turnIndex: { type: Number, default: 0 },
    turnPlayer: { type: String, default: null}
});

module.exports = mongoose.model('Rooms', roomSchema);