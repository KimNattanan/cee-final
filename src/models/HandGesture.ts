import mongoose from 'mongoose';

const HandGestureSchema = new mongoose.Schema({
  id: { type: String, required: true },
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  handmode:{
    type:Number,
    required: true
  },
  gestureName: { 
    type: String, 
    required: true 
  },
  gestureText: { 
    type: String, 
    required: true 
  },
  landmark: { 
    type: [[Number]], 
    required: true 
  },
}, { timestamps: true });

export default mongoose.models.HandGesture || mongoose.model('HandGesture', HandGestureSchema);