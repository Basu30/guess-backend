const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    score: { type: Number, required: true, default: 0 },
    role: { type: String, enum: ['player', 'host'], default: 'player'}
});

module.exports = mongoose.model('User', userSchema);