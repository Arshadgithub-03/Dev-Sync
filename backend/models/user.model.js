import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
 
// Define the schema for a user
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: [2, 'Name must be at least 2 characters long'],
        maxLength: [50, 'Name must not be longer than 50 characters']
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        trim: true,
        lowercase: true,
        minLength: [6, 'Email must be atleast 6 characters long'],
        maxLength: [50, 'Email must not be longer than 50 characters']
    },
    password: {
        type: String,
        select: false,
    }
})

// Hash the password before saving
userSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
}

// Validate the password
userSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

// Generate a JWT token for the user
userSchema.methods.generateJWT = function () {
    return jwt.sign(
        { email: this.email },
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
    );
}

// Create the User model
const User = mongoose.model('user', userSchema);

export default User;