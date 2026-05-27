import mongoose from "mongoose";

const addressCacheSchema = new mongoose.Schema({
  fullAddress: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  placeId: { type: String, trim: true },
  formattedAddress: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now, expires: "90d" } // Cache for 90 days
});

const AddressCache = mongoose.model("AddressCache", addressCacheSchema);

export default AddressCache;
