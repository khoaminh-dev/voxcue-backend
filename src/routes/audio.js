const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * POST /api/audio
 * Create a new audio file record linked to a project
 */
router.post('/', async (req, res) => {
  try {
    const { projectId, title, audioUrl, duration, status, text } = req.body;

    if (!projectId || !title || !audioUrl) {
      return res.status(400).json({ error: 'projectId, title, and audioUrl are required' });
    }

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user.uid
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    const audioFile = await prisma.audioFile.create({
      data: {
        projectId,
        title,
        audioUrl,
        duration,
        status: status || 'PROCESSED',
        text
      }
    });

    res.status(201).json(audioFile);
  } catch (error) {
    console.error('Error creating audio file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/audio/:id
 * Delete an audio file
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First find the audio file and its project to verify ownership
    const audioFile = await prisma.audioFile.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!audioFile || audioFile.project.userId !== req.user.uid) {
      return res.status(404).json({ error: 'Audio file not found or unauthorized' });
    }

    await prisma.audioFile.delete({
      where: { id }
    });

    res.json({ message: 'Audio file deleted successfully' });
  } catch (error) {
    console.error('Error deleting audio file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
