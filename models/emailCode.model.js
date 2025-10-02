import mongoose from 'mongoose'

const EmailCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
}, { timestamps: true })

export default mongoose.model('EmailCode', EmailCodeSchema)
