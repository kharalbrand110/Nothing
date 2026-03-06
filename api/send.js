// api/send.js
import { Buffer } from 'buffer';

const sessions = new Map();

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { sessionId, to, message } = req.body;

        if (!sessionId || !to || !message) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const session = sessions.get(sessionId);
        
        if (!session || !session.connected) {
            return res.status(400).json({ success: false, error: 'Not connected' });
        }

        // Format recipient number
        const cleanNumber = to.replace(/[^0-9]/g, '');
        const jid = `${cleanNumber}@s.whatsapp.net`;

        // Send message
        await session.sock.sendMessage(jid, { text: message });

        return res.json({ success: true, message: 'Message sent' });

    } catch (error) {
        console.error('Send error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to send message'
        });
    }
}
