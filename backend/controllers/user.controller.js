import userModel from '../models/user.model.js';
import * as userService from '../services/user.service.js';
import { validationResult } from 'express-validator';
import redisClient from '../services/redis.service.js';

// Controller to handle user registration
export const createUserController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()})
    }

    try {
        const user = await userService.createUser(req.body);
        const token = await user.generateJWT();
        delete user._doc.password;
        res.status(201).json({user, token});
    } catch (error) {
        res.status(400).send(error.message);
    }
}

// Controller to handle user login
export const loginController = async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { email, password } = req.body;
        console.log("Login Attempt:", email);  

        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                errors: 'Invalid credentials'
            })
        }

        const isMatch = await user.isValidPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                errors: 'Invalid credentials'
            })
        }

        const token = await user.generateJWT();

        delete user._doc.password;

        res.status(200).json({ user: { ...user._doc } , token });

    } catch (err) {
        res.status(400).send(err.message);
    }
}

// Controller to get the profile of the logged-in user
export const profileController = async (req, res) => {
    console.log(req.user);

    res.status(200).json({
        user: req.user
    })
}

// Controller to handle user logout
export const logoutController = async (req, res) => {
    try{

        const token = req.cookies.token || req.headers.authorization.
        split(' ')[ 1 ];

        redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);

        res.status(200).json({
            message: 'Logged out successfully'
        });


     } catch (err) {
        console.log(err);
    }
}

// Controller to get all users (admin)
export const getAllUsersController = async (req, res) => {
    try {

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        }).select("name email")

        const allUsers = await userService.getAllUsers({ 
            userId: loggedInUser._id 
        })

        return res.status(200).json({
            loggedInUser,
            users: allUsers
        })
    } 
    catch (err) {
        console.log(err)

        res.status(400).json({ error: err.message })
    }
}

// Controller to get the logged-in user's basic info
export const meController = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({
            email: req.user.email
        }).select("name email") // Select only name and email    
        return res.status(200).json({
            user: loggedInUser
        })  
    }
    catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }   
}