const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 30000,
  pingInterval: 10000,
  connectTimeout: 20000
});

const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_foodlink_jwt_key_123';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --------- MongoDB Connection ---------
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodlink';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('MongoDB connection error:', err));

app.get('/version', (req, res) => res.json({ version: '1.1', status: 'Force-Synced' }));

// --------- Schemas ---------
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'volunteer'], required: true }
});
const User = mongoose.model('User', UserSchema);

const FoodSchema = new mongoose.Schema({
  name: String,
  quantity: String,
  location: String,
  status: { type: String, default: 'available' },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiryTime: String,
  deliveryMode: String,
  lat: Number,
  lng: Number,
  volunteerLocation: {
    lat: Number,
    lng: Number
  },
  image: String, // Base64 string for food image
  createdAt: { type: Date, default: Date.now }
});
const Food = mongoose.model('Food', FoodSchema);

const NotificationSchema = new mongoose.Schema({
  role: String,
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', NotificationSchema);

const ChatSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now }
});
const Chat = mongoose.model('Chat', ChatSchema);

// --------- Middleware ---------
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, role }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --------- Auth Routes ---------
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        error: `Email already registered as ${existing.role.toUpperCase()}. Please Login.` 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role });
    await user.save();
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, role: user.role, email: user.email, userId: user._id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      role: user.role, 
      email: user.email, 
      userId: user._id 
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Food Routes ---------
app.post('/foods', authMiddleware, async (req, res) => {
  if (req.user.role !== 'donor') return res.status(403).json({ error: 'Only donors can post foods' });
  try {
    const { name, quantity, location, expiryTime, deliveryMode, lat, lng, image } = req.body;
    const food = new Food({ 
      name, 
      quantity, 
      location, 
      expiryTime, 
      deliveryMode, 
      lat: parseFloat(lat), 
      lng: parseFloat(lng), 
      image,
      donorId: req.user.userId 
    });
    await food.save();
    
    // Notify all volunteers
    await Notification.create({ role: 'volunteer', message: `New food "${food.name}" is available nearby!` });
    
    res.status(201).json(food);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/foods', authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'donor') {
      query = { donorId: req.user.userId };
    }
    const foods = await Food.find(query).sort({ createdAt: -1 });
    
    // Map _id to id to not break existing frontend code
    const result = foods.map(f => {
      const obj = f.toObject();
      obj.id = obj._id;
      return obj;
    });
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/foods/:id/accept', authMiddleware, async (req, res) => {
  if (req.user.role !== 'volunteer') return res.status(403).json({ error: 'Only volunteers can accept.' });
  try {
    const food = await Food.findById(req.params.id);
    if (!food || food.status !== 'available') return res.status(400).json({ error: 'Food not available' });
    
    food.status = 'accepted';
    await food.save();
    
    // Notify specific donor
    await Notification.create({ 
      role: 'donor', 
      recipientId: food.donorId, 
      message: `Your food "${food.name}" was accepted by a volunteer!` 
    });
    
    res.json(food);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/foods/:id/deliver', authMiddleware, async (req, res) => {
  if (req.user.role !== 'volunteer') return res.status(403).json({ error: 'Only volunteers can deliver.' });
  try {
    const food = await Food.findById(req.params.id);
    if (!food || food.status !== 'accepted') return res.status(400).json({ error: 'Food not accepted yet' });
    
    food.status = 'delivered';
    await food.save();
    
    // Notify donor
    await Notification.create({ recipientId: food.donorId, message: `Your food "${food.name}" was delivered!` });
    
    res.json(food);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/foods/:id', authMiddleware, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ error: 'Food not found' });
    
    // Check ownership
    if (food.donorId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this post.' });
    }
    
    await Food.deleteOne({ _id: req.params.id });
    res.json({ message: 'Post deleted successfully' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/foods/:id/location', authMiddleware, async (req, res) => {
  if (req.user.role !== 'volunteer') return res.status(403).json();
  try {
    const { lat, lng } = req.body;
    const food = await Food.findById(req.params.id);
    if(food) {
        food.volunteerLocation = { lat, lng };
        await food.save();
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// --------- Chats ---------
app.get('/chats/:foodId', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ foodId: req.params.foodId }).sort({ createdAt: 1 });
    res.json(chats);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/chats/:foodId', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const chat = new Chat({ 
      foodId: req.params.foodId, 
      sender: req.user.userId, 
      text 
    });
    await chat.save();
    
    // Real-time broadcast
    console.log(`📡 Broadcasting chat to room ${req.params.foodId}`);
    io.to(req.params.foodId).emit('new_message', chat);
    
    res.status(201).json(chat);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// --------- Notifications ---------
app.get('/notifications/:role', authMiddleware, async (req, res) => {
  if (req.user.role !== req.params.role) return res.status(403).json([]);
  try {
    const query = { role: req.user.role, read: false };
    // Only filter by recipientId for donors (volunteers currently get global alerts)
    if (req.user.role === 'donor') {
      query.recipientId = req.user.userId;
    }
    
    const notifs = await Notification.find(query);
    for (const n of notifs) { n.read = true; await n.save(); }
    res.json(notifs);
  } catch(e) { res.status(500).json([]); }
});

// --------- Socket Logic ---------
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  socket.on('join_room', (foodId) => {
    socket.join(foodId);
    console.log(`🏠 Socket ${socket.id} joined room ${foodId}`);
  });

  socket.on('disconnect', (reason) => {
    console.log('🚪 User disconnected:', socket.id, 'Reason:', reason);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
