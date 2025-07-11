import fs from 'fs/promises';
import path from 'path';
import userService from '../../../services/user/userService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require userId as query param
  const { userId } = req.query;
  if (!userId) {
    return res.status(401).json({ error: 'Missing userId' });
  }
  const user = await userService.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const stateFile = path.join(process.cwd(), 'video_pipeline_state.json');
    
    try {
      const stateData = await fs.readFile(stateFile, 'utf8');
      const state = JSON.parse(stateData);
      
      return res.status(200).json(state);
    } catch (error) {
      // If state file doesn't exist, return empty state
      return res.status(200).json({
        completed: [],
        failed: [],
        stats: {
          total: 0,
          completed: 0,
          failed: 0,
          retries: 0,
          startTime: null,
          lastSave: null
        }
      });
    }
  } catch (error) {
    console.error('Error reading pipeline state:', error);
    return res.status(500).json({ error: 'Failed to read pipeline state' });
  }
} 