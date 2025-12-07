const express = require('express');

const roomController = require('../controllers/room-controller');


const router = express.Router();

router.post('/room', roomController.createRoom);
router.post('/room/:rid/join', roomController.joinRoom)
router.get('/rooms', roomController.getRooms);
router.get('/room/:rid', roomController.getRoomById);
router.patch('/rooms/:rid/reset', roomController.resetGame);  // NOT IN USE
router.delete('/rooms/:rid/player/:pid', roomController.deletePlayer);
router.delete('/:rid', roomController.deleteRoom)

module.exports = router;