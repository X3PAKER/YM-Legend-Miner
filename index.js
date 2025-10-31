require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// --- Mongoose models ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err=> console.error(err));

const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: { type: String }, // optional
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, required: true },
  inviteCode: { type: String, unique: true }, // generated e.g. user_62672
  referrer: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // direct referrer
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// helper: generate invite code
function genInviteCode() {
  // simple unique code - for production you should verify uniqueness
  return 'user_' + Math.random().toString(36).substring(2,9);
}

// auth middleware (simple)
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing token' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }
}

// --- Routes ---

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { email, phone, password, inviteCode } = req.body;
    if (!password || (!email && !phone)) {
      return res.status(400).json({ error: 'Provide email or phone and password' });
    }
    if (!inviteCode) {
      return res.status(400).json({ error: 'inviteCode is required' });
    }

    // find referrer by inviteCode
    const referrer = await User.findOne({ inviteCode });
    if (!referrer) {
      return res.status(400).json({ error: 'Invalid inviteCode' });
    }

    // check existing email/phone
    if (email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ error: 'Email already in use' });
    }
    if (phone) {
      const exists = await User.findOne({ phone });
      if (exists) return res.status(400).json({ error: 'Phone already in use' });
    }

    // create user
    const passwordHash = await bcrypt.hash(password, 10);
    let code = genInviteCode();
    // ensure code unique (loop)
    while (await User.findOne({ inviteCode: code })) code = genInviteCode();

    const newUser = new User({
      email: email || null,
      phone: phone || null,
      passwordHash,
      inviteCode: code,
      referrer: referrer._id
    });
    await newUser.save();

    // create token
    const token = jwt.sign({ id: newUser._id, inviteCode: newUser.inviteCode }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ success: true, token, user: { id: newUser._id, inviteCode: newUser.inviteCode } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Login
app.post('/api/login', async (req,res) => {
  try {
    const { email, phone, password } = req.body;
    if ((!email && !phone) || !password) return res.status(400).json({ error: 'Provide email or phone and password' });

    const user = await User.findOne(email ? { email } : { phone });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, inviteCode: user.inviteCode }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success:true, token, user: { id: user._id, inviteCode: user.inviteCode } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error:'Server error' });
  }
});

// Get referrals (F1, F2, F3) for a given user
app.get('/api/referrals/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    // ensure requester is the same user or admin; simple check:
    if (req.user.id !== userId) {
      // for security in production, add admin role; here we allow if same user
      return res.status(403).json({ error: 'Forbidden' });
    }

    // F1: direct referrals where referrer = userId
    const f1 = await User.find({ referrer: userId }).select('email phone inviteCode createdAt').lean();

    // F2: referrals of each F1
    const f1Ids = f1.map(u => u._id);
    const f2 = await User.find({ referrer: { $in: f1Ids } }).select('email phone inviteCode createdAt referrer').lean();

    // F3: referrals of each F2
    const f2Ids = f2.map(u => u._id);
    const f3 = await User.find({ referrer: { $in: f2Ids } }).select('email phone inviteCode createdAt referrer').lean();

    return res.json({ f1, f2, f3, counts: { f1: f1.length, f2: f2.length, f3: f3.length } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Example endpoint to get user profile by token
app.get('/api/me', authMiddleware, async (req,res) => {
  const user = await User.findById(req.user.id).select('email phone inviteCode createdAt').lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ user });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
