/**
 * Vercel API Endpoint: /api/saveChat
 * 
 * This endpoint saves chat interactions to Supabase database.
 * It receives user messages, bot responses, website information, and IP address.
 * 
 * Expected POST request body:
 * {
 *   userMessage: string,
 *   botResponse: string,
 *   website: string,
 *   ipAddress: string (optional),
 *   sessionId: string (UUID),
 *   messageIndex: number,
 *   timeToRespond: number (milliseconds),
 *   category: string (optional),
 *   geoLocationCity: string (optional)
 * }
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests' 
    });
  }

  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    // Validate environment variables
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Supabase credentials not configured' 
      });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract data from request body
    const { 
      userMessage, 
      botResponse, 
      website, 
      ipAddress,
      sessionId,
      messageIndex,
      timeToRespond,
      category,
      geoLocationCity
    } = req.body;

    // Validate required fields
    if (!userMessage || !website || !sessionId) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'userMessage, website, and sessionId are required' 
      });
    }

    // Get user's IP address from request headers (fallback options)
    const userIp = ipAddress || 
                   req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                   req.headers['x-real-ip'] ||
                   req.socket?.remoteAddress ||
                   null;

    // Prepare data for insertion
    const chatData = {
      user_message: userMessage,
      bot_response: botResponse || null,
      website: website,
      user_ip: userIp,
      session_id: sessionId,
      message_index: messageIndex || null,
      time_to_respond: timeToRespond || null,
      category: category || null,
      geo_location_city: geoLocationCity || null,
      created_at: new Date().toISOString()
    };

    // Insert chat data into Supabase
    const { data, error } = await supabase
      .from('chat_logs')
      .insert([chatData])
      .select();

    // Handle Supabase errors
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Database error',
        message: error.message 
      });
    }

    // Success response
    console.log('✅ Chat saved successfully:', data);
    return res.status(200).json({ 
      success: true,
      message: 'Chat saved successfully',
      data: data 
    });

  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in saveChat API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
