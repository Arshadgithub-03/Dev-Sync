import express from "express";
import * as userController from '../controllers/user.controller.js';
import { body } from "express-validator";
import { authUser } from "../middleware/auth.middleware.js";

// Create a router for user-related routes
const router = express.Router();

// Register a new user
router.post('/register',
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
    userController.createUserController
);

// Login a user
router.post('/login',
    body('email').isEmail().withMessage('Enter a valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Enter a valid password'),
    userController.loginController
);

// Get user profile (protected)
router.get('/profile', authUser, userController.profileController);

// Logout user (protected)
router.get('/logout', authUser, userController.logoutController);

// Get all users (protected)
router.get('/all', authUser, userController.getAllUsersController);

// Get current user info (protected)
router.get('/me', authUser, userController.meController);

export default router;