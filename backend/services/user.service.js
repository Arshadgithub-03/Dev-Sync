import userModel from '../models/user.model.js';

// Create a new user with hashed password
export const createUser = async ({ name, email, password }) => {
    if (!name || !email || !password) {
        throw new Error('Name, Email, and Password are required');
    }
    const hashedPassword = await userModel.hashPassword(password);
    const user = await userModel.create({
        name,
        email, 
        password: hashedPassword
    });
    return user;
};

// Get all users except the one with the given userId
export const getAllUsers = async ({ userId }) => {
    const users = await userModel.find({
        _id: { $ne: userId }
    }, "name email")
    return users
}