// api/pair.js
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Buffer } = require('buffer');

// Store active sessions (in production, use Redis or database)
const sessions = new Map();

export default async function handler(req, res) {
    // Enable CORS
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
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ success: false, error: 'Phone number required' });
        }

        // Clean phone number
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        // Generate session ID
        const sessionId = Date.now().toString();
        
        // Create auth folder for this session
        const { state, saveCreds } = await useMultiFileAuthState(`./auth_${sessionId}`);
        
        // Create socket
        const sock = makeWASocket({
            printQRInTerminal: false,
            auth: state,
            browser: ['Chrome (Linux)', '', '']
        });

        // Generate pairing code
        const pairingCode = await sock.requestPairingCode(cleanNumber);
        
        // Format code (add hyphen in middle)
        const formattedCode = pairingCode.match(/.{1,4}/g).join('-');

        // Store session
        sessions.set(sessionId, {
            sock,
            saveCreds,
            phoneNumber: cleanNumber,
            connected: false,
            createdAt: Date.now()
        });

        // Set connection listener
        sock.ev.on('connection.update', (update) => {
            const { connection } = update;
            if (connection === 'open') {
                const session = sessions.get(sessionId);
                if (session) {
                    session.connected = true;
                }
            }
        });

        // Return success with code
        return res.status(200).json({
            success: true,
            code: formattedCode,
            sessionId: sessionId,
            message: 'Enter this code in WhatsApp → Linked Devices → Link with phone number'
        });

    } catch (error) {
        console.error('Pairing error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to generate pairing code'
        });
    }
              }
