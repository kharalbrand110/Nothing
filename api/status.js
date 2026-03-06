// api/status.js
import { Buffer } from 'buffer';

// In production, use proper database
const sessions = new Map();

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { sessionId } = req.query;
    
    if (!sessionId) {
        return res.status(400).json({ success: false, error: 'Session ID required' });
    }
    
    const session = sessions.get(sessionId);
    
    if (!session) {
        return res.json({ success: true, connected: false });
    }
    
    return res.json({
        success: true,
        connected: session.connected || false,
        phoneNumber: session.phoneNumber
    });
}
