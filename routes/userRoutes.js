import express from 'express';
import { registerUser, authUser, getUsers, updateUserStatus, updateUserProfile } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, (req, res) => res.json(req.user));
router.put('/profile', protect, updateUserProfile);

// Admin Routes [cite: 55]
router.get('/', protect, admin, getUsers);
router.put('/:id/status', protect, admin, updateUserStatus);

export default router;