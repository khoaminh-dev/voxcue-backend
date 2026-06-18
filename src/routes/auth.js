const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const admin = require('../config/firebase-admin');

const prisma = new PrismaClient();

// POST /api/auth/login
// Synchronizes Firebase user with our Database
router.post('/login', requireAuth, async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;

    // Check if user exists in our DB
    let user = await prisma.user.findUnique({
      where: { firebaseUid: uid }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          firebaseUid: uid,
          email: email,
          name: name || email.split('@')[0],
          avatar: picture,
          role: 'USER',
          credits: 100 // Starting credits
        }
      });
      
      // We can also set custom claims here for the first time if needed,
      // but usually role management is done by an Admin panel.
      // await admin.auth().setCustomUserClaims(uid, { role: 'USER' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        credits: user.credits
      }
    });

  } catch (error) {
    console.error('Login Route Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Utility endpoint: Make me admin (For testing purposes, normally secured)
// In a real app, you'd secure this with a secret key or remove it.
router.post('/make-me-admin', requireAuth, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Update DB
    const user = await prisma.user.update({
      where: { firebaseUid: uid },
      data: { role: 'ADMIN' }
    });
    
    // Set custom claim in Firebase
    await admin.auth().setCustomUserClaims(uid, { role: 'ADMIN' });
    
    res.status(200).json({ message: 'User is now an admin. Please re-login to refresh token claims.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to set admin role' });
  }
});

module.exports = router;
