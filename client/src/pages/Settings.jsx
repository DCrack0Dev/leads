import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Shield, Mail, Phone, Globe, Sliders, MapPin, Tag } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async (key, value) => {
    setIsSaving(true);
    try {
      await axios.post('/api/settings', { key, value: value.toString() });
      setSettings(prev => ({ ...prev, [key]: value }));
      setIsSaving(false);
    } catch (error) {
      alert('Failed to save setting.');
      setIsSaving(false);
    }
  };

  const SettingGroup = ({ title, icon: Icon, children }) => (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <Icon className="w-6 h-6 text-indigo-500" />
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );

  const InputField = ({ label, id, type = "text", placeholder }) => (
    <div className="space-y-1">
      <label className="block text-sm font-bold text-gray-700">{label}</label>
      <div className="flex gap-2">
        <input 
          type={type} 
          id={id}
          value={settings[id] || ''}
          onChange={(e) => setSettings(prev => ({ ...prev, [id]: e.target.value }))}
          placeholder={placeholder}
          className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
        />
        <button 
          onClick={() => handleSave(id, settings[id])}
          className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition shadow-sm"
        >
          Save
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Settings</h1>
        <p className="text-gray-500 font-medium">Configure your bot and API integrations.</p>
      </div>

      <SettingGroup title="API Integration" icon={Shield}>
        <InputField label="Google Places API Key" id="GOOGLE_PLACES_API_KEY" placeholder="AIza..." type="password" />
        <InputField label="Brevo API Key" id="BREVO_API_KEY" placeholder="xkeysib-..." type="password" />
      </SettingGroup>

      <SettingGroup title="Outreach Config" icon={Mail}>
        <InputField label="From Email" id="FROM_EMAIL" placeholder="tebogo@demitech.co.za" />
        <InputField label="From Name" id="FROM_NAME" placeholder="Tebogo | Demitech" />
        <InputField label="My Phone (WhatsApp)" id="MY_PHONE" placeholder="071 234 5678" />
        <InputField label="Base URL (for Demos)" id="BASE_URL" placeholder="http://localhost:5173" />
      </SettingGroup>

      <SettingGroup title="Bot Schedule" icon={Sliders}>
        <InputField label="Daily Email Limit" id="DAILY_EMAIL_LIMIT" type="number" placeholder="280" />
        <InputField label="Bot Run Time" id="BOT_RUN_TIME" placeholder="08:00" />
        <InputField label="Website Score Threshold" id="WEBSITE_SCORE_THRESHOLD" type="number" placeholder="44" />
      </SettingGroup>

      <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 flex items-start gap-4">
        <div className="bg-yellow-100 p-2 rounded-lg">
          <Shield className="w-5 h-5 text-yellow-700" />
        </div>
        <div>
          <h3 className="font-bold text-yellow-900 mb-1">Security Note</h3>
          <p className="text-sm text-yellow-700 leading-relaxed">
            API keys are saved to your local SQLite database. Ensure your computer is secure. 
            These keys are never transmitted to Demitech or any third party except the direct API endpoints.
          </p>
        </div>
      </div>
    </div>
  );
}
