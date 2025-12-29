import User from '../models/Users.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

export const registerUser = async (req, res) => {
    const { fullName, email, password } = req.body;

    // Email format validation [cite: 37, 72]
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' });

    // Password strength validation (min 8 chars, 1 number) [cite: 38, 73]
    if (password.length < 8 || !/\d/.test(password)) {
        return res.status(400).json({ message: 'Password must be 8+ chars with at least one number' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ fullName, email, password });
    res.status(201).json({ _id: user._id, fullName: user.fullName, role: user.role, token: generateToken(user._id) });
};

export const authUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (user.status === 'inactive') return res.status(403).json({ message: 'Account deactivated' });
        
        user.lastLogin = Date.now(); // [cite: 123]
        await user.save();
        res.json({ _id: user._id, fullName: user.fullName, role: user.role, token: generateToken(user._id) });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
};

export const getUsers = async (req, res) => {
    const pageSize = 10; // [cite: 80, 111]
    const page = Number(req.query.pageNumber) || 1;
    const count = await User.countDocuments();
    const users = await User.find({}).limit(pageSize).skip(pageSize * (page - 1));
    res.json({ users, page, pages: Math.ceil(count / pageSize) });
};

export const updateUserStatus = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        user.status = req.body.status; // [cite: 46, 47]
        await user.save();
        res.json({ message: 'User status updated' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

export const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        user.fullName = req.body.fullName || user.fullName;
        user.email = req.body.email || user.email;
        if (req.body.password) user.password = req.body.password; // [cite: 50, 51, 87, 88]
        const updated = await user.save();
        res.json({ fullName: updated.fullName, email: updated.email });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};