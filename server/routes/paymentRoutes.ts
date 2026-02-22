import express from 'express';
import { createSession, handleCallback } from '../controllers/paymentController';

const router = express.Router();

// Create Payment Session
router.post('/create-session', createSession);

// Callback from Bank
router.post('/callback', handleCallback);

export default router;
