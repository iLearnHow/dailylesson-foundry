import { exec } from 'child_process';
import { promisify } from 'util';
import userService from '../../../services/user/userService';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth: expect userId in body (replace with real auth in production)
  const { userId } = req.body;
  if (!userId) {
    return res.status(401).json({ error: 'Missing userId' });
  }

  const user = await userService.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (user.credit_balance < 1) {
    return res.status(402).json({ error: 'Insufficient credits' });
  }

  try {
    // Decrement credit before starting
    await userService.decrementCredits(userId, 1);
    console.log(`🚀 Starting HeyGen video pipeline for user ${user.email}...`);
    
    // Start the pipeline in the background
    const { stdout, stderr } = await execAsync('node scripts/test_pipeline.js', {
      cwd: process.cwd(),
      env: { ...process.env }
    });
    
    console.log('Pipeline started:', stdout);
    if (stderr) {
      console.error('Pipeline stderr:', stderr);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Pipeline started successfully',
      output: stdout 
    });
  } catch (error) {
    console.error('Failed to start pipeline:', error);
    return res.status(500).json({ 
      error: 'Failed to start pipeline',
      details: error.message 
    });
  }
} 