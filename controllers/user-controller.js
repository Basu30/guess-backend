const User = require('../models/user');
const HttpError = require('../models/http-error');



const createUser = async (req, res, next) => {
    const { name, score, role} = req.body;

    const newUser = new User({
        name,
        score,
        role
    });

    try {
        await newUser.save()
    } catch (err) {
        const error = new HttpError('Failed to add new user. Please try again!', 500);
        return next(error);
    };

    res.status(200).json({ user: newUser.toObject({ getters: true })});
};

const getUsers = async (req, res, next) => {
    let user;
    try {
        user = await User.find();
    } catch(err) {
        const error =  new HttpError('Could not find users', )
        return next(error);
    }
    res.status(200).json({ users: user.map(u => u.toObject({ getters: true}))})
};


exports.createUser = createUser;
exports.getUsers = getUsers;

