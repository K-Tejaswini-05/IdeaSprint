const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
const JWT_SECRET = 'supersecret_foodlink_jwt_key_123'; // Hardcoded for local dev

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --------- MongoDB Connection ---------
mongoose.connect('mongodb://localhost:27017/foodlink')
  .then(() => console.log('Connected to MongoDB via local Compass port 27017'))
  .catch((err) => console.log('MongoDB connection error:', err));

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
  volunteerLocation: {
    lat: Number,
    lng: Number
  },
  createdAt: { type: Date, default: Date.now }
});
const Food = mongoose.model('Food', FoodSchema);

const NotificationSchema = new mongoose.Schema({
  role: String,
  message: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', NotificationSchema);

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
    if (existing) return res.status(400).json({ error: 'Email already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role });
    await user.save();
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, role: user.role, email: user.email });
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
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: user.role, email: user.email });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Food Routes ---------
app.post('/foods', authMiddleware, async (req, res) => {
  if (req.user.role !== 'donor') return res.status(403).json({ error: 'Only donors can post foods' });
  try {
    const { name, quantity, location } = req.body;
    const food = new Food({ name, quantity, location, donorId: req.user.userId });
    await food.save();
    
    // Notify volunteers
    await Notification.create({ role: 'volunteer', message: `New food available: ${food.name} at ${food.location}` });
    
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
    
    // Notify donor
    await Notification.create({ role: 'donor', message: `Your food "${food.name}" was accepted by a volunteer!` });
    
    res.json(food);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/foods/:id/deliver', authMiddleware, async (req, res) => {
  if (req.user.role !== 'volunteer') return res.status(403).json({ error: 'Only volunteers can deliver.' });
  try {
    const food = await Food.findById(req.params.id);
    if (!food || food.status !== 'accepted') return res.status(400).json({ error: 'Cannot mark as delivered' });
    
    food.status = 'delivered';
    await food.save();
    
    await Notification.create({ role: 'donor', message: `Your food "${food.name}" was successfully delivered!` });
    
    res.json(food);
  } catch(e) { res.status(500).json({ error: e.message }); }
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

// --------- Notifications ---------
app.get('/notifications/:role', authMiddleware, async (req, res) => {
  if (req.user.role !== req.params.role) return res.status(403).json([]);
  try {
    const notifs = await Notification.find({ role: req.user.role, read: false });
    for (const n of notifs) { n.read = true; await n.save(); }
    res.json(notifs);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.listen(port, () => {
  console.log(`FoodLink Node/MongoDB server running at http://localhost:${port}`);
});
