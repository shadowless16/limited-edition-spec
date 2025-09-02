import mongoose from 'mongoose'

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true })

export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema)

export default Settings
