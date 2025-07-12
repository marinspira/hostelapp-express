import mongoose from 'mongoose';

const errorLogSchema = new mongoose.Schema({
  message: String,
  stack: String,
  route: String,
  method: String,
  time: { type: Date, default: Date.now },
});

const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);
export default ErrorLog;
