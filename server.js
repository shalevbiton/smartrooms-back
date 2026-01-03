import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.SECRET_KEY || 'your_super_secret_key_for_jwt';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables!');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS Configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Helper functions to map between DB and API formats
const mapUserFromDB = (dbUser) => ({
  id: dbUser.id,
  personalId: dbUser.personal_id,
  password: dbUser.password,
  name: dbUser.name,
  base: dbUser.base,
  jobTitle: dbUser.job_title,
  phoneNumber: dbUser.phone_number,
  role: dbUser.role,
  status: dbUser.status,
  avatar: dbUser.avatar,
  customBackground: dbUser.custom_background,
});

const mapUserToDB = (user) => ({
  personal_id: user.personalId,
  password: user.password,
  name: user.name,
  base: user.base,
  job_title: user.jobTitle,
  phone_number: user.phoneNumber,
  role: user.role,
  status: user.status,
  avatar: user.avatar,
  custom_background: user.customBackground,
});

const mapRoomFromDB = (dbRoom) => ({
  id: dbRoom.id,
  name: dbRoom.name,
  capacity: dbRoom.capacity,
  equipment: dbRoom.equipment || [],
  imageUrl: dbRoom.image_url,
  description: dbRoom.description,
  isAvailable: dbRoom.is_available,
  isRecorded: dbRoom.is_recorded,
});

const mapRoomToDB = (room) => ({
  name: room.name,
  capacity: room.capacity,
  equipment: room.equipment || [],
  image_url: room.imageUrl,
  description: room.description,
  is_available: room.isAvailable,
  is_recorded: room.isRecorded,
});

const mapBookingFromDB = (dbBooking) => ({
  id: dbBooking.id,
  roomId: dbBooking.room_id,
  userId: dbBooking.user_id,
  userName: dbBooking.user_name,
  title: dbBooking.title,
  investigatorId: dbBooking.investigator_id,
  secondInvestigatorId: dbBooking.second_investigator_id,
  interrogatedName: dbBooking.interrogated_name,
  offenses: dbBooking.offenses,
  description: dbBooking.description,
  startTime: dbBooking.start_time,
  endTime: dbBooking.end_time,
  status: dbBooking.status,
  createdAt: dbBooking.created_at,
  isRecorded: dbBooking.is_recorded,
  checkoutVideoUrl: dbBooking.checkout_video_url,
  phoneNumber: dbBooking.phone_number,
});

const mapBookingToDB = (booking) => ({
  room_id: booking.roomId,
  user_id: booking.userId,
  user_name: booking.userName,
  title: booking.title,
  investigator_id: booking.investigatorId,
  second_investigator_id: booking.secondInvestigatorId,
  interrogated_name: booking.interrogatedName,
  offenses: booking.offenses,
  description: booking.description,
  start_time: booking.startTime,
  end_time: booking.endTime,
  status: booking.status,
  is_recorded: booking.isRecorded,
  checkout_video_url: booking.checkoutVideoUrl,
  phone_number: booking.phoneNumber,
});

// Auth endpoints
app.post('/auth/login', (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).json({ error: "User data missing" });
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '30d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
  res.json({ success: true, user });
});

app.get('/auth/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No session found" });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ id: decoded.id, name: decoded.name, role: decoded.role });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Users API
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    res.json(data.map(mapUserFromDB));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(mapUserFromDB(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').insert(mapUserToDB(req.body)).select().single();
    if (error) throw error;
    res.json(mapUserFromDB(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const updateData = {};
    if (req.body.personalId !== undefined) updateData.personal_id = req.body.personalId;
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.base !== undefined) updateData.base = req.body.base;
    if (req.body.jobTitle !== undefined) updateData.job_title = req.body.jobTitle;
    if (req.body.phoneNumber !== undefined) updateData.phone_number = req.body.phoneNumber;
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.avatar !== undefined) updateData.avatar = req.body.avatar;
    if (req.body.customBackground !== undefined) updateData.custom_background = req.body.customBackground;
    
    const { data, error } = await supabase.from('users').update(updateData).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(mapUserFromDB(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rooms API
app.get('/api/rooms', async (req, res) => {
  try {
    const { data, error } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data.map(mapRoomFromDB));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(mapRoomFromDB(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { data, error } = await supabase.from('rooms').insert(mapRoomToDB(req.body)).select().single();
    if (error) throw error;
    res.json(mapRoomFromDB(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.capacity !== undefined) updateData.capacity = req.body.capacity;
    if (req.body.equipment !== undefined) updateData.equipment = req.body.equipment;
    if (req.body.imageUrl !== undefined) updateData.image_url = req.body.imageUrl;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.isAvailable !== undefined) updateData.is_available = req.body.isAvailable;
    if (req.body.isRecorded !== undefined) updateData.is_recorded = req.body.isRecorded;
    
    const { data, error } = await supabase.from('rooms').update(updateData).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(mapRoomFromDB(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('rooms').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bookings API
app.get('/api/bookings', async (req, res) => {
  try {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data.map(mapBookingFromDB));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('bookings').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(mapBookingFromDB(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { data, error } = await supabase.from('bookings').insert(mapBookingToDB(req.body)).select().single();
    if (error) throw error;
    res.json(mapBookingFromDB(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const updateData = {};
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.checkoutVideoUrl !== undefined) updateData.checkout_video_url = req.body.checkoutVideoUrl;
    if (req.body.isRecorded !== undefined) updateData.is_recorded = req.body.isRecorded;
    
    const { data, error } = await supabase.from('bookings').update(updateData).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(mapBookingFromDB(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('bookings').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API running at http://localhost:${PORT}`);
});
