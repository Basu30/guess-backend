// const mongoose = require('mongoose');

// const Schema = mongoose.Schema;

// const roomSchema = new Schema({
//     rName: { type: String, required: true },
//     rHost: { type: String, required: true },
//     avatarSrc: { type: String, },
//     players: [
//         {
//             name: { type: String, required: true},
//             avatarSrc: {type: String},
//             score: {type: Number, default: 0}
//         }
//     ], 
//     createdAt: {type: Date, default: Date.now},
//     gameStarted: { type: Boolean, default: false},
//     turnIndex: { type: Number, default: 0 },
//     turnPlayer: { type: String, default: null}
// });

// module.exports = mongoose.model('Rooms', roomSchema);

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Player subdocument schema
const playerSchema = new Schema(
  {
    name: { type: String, required: true },
    avatarSrc: { type: String },
    score: { type: Number, default: 0 },
  },
  {
    _id: true,            // KEEP unique IDs for players
    id: false             // REMOVE virtual 'id'
  }
);

// Main room schema
const roomSchema = new Schema(
  {
    rName: { type: String, required: true },
    rHost: { type: String, required: true },
    avatarSrc: { type: String },
    players: [playerSchema],

    createdAt: { type: Date, default: Date.now },
    gameStarted: { type: Boolean, default: false },
    turnIndex: { type: Number, default: 0 },
    turnPlayer: { type: String, default: null }
  },
  {
    versionKey: false,     // removes __v
    timestamps: false
  }
);

// Remove virtual id from toObject() and toJSON()
roomSchema.set('toObject', {
  virtuals: false,
  transform: (_, ret) => {
    delete ret.id; // remove Mongoose virtual id
  }
});

roomSchema.set('toJSON', {
  virtuals: false,
  transform: (_, ret) => {
    delete ret.id; // remove Mongoose virtual id
  }
});

module.exports = mongoose.model('Rooms', roomSchema);
