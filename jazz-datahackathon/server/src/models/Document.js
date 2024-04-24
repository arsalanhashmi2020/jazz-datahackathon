import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  embedding: [{ type: Number }], // Assuming embedding is an array of numbers
});

const Document = mongoose.model('Document', documentSchema);

export default Document;
