import React, { useState } from 'react';
import { X, ExternalLink, Mail, MessageCircle, Phone, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function LeadDetailPanel({ lead, onClose, onUpdate }) {
  const [notes, setNotes] = useState(lead.notes || '');
  const [status, setStatus] = useState(lead.status || 'new');
  const [email, setEmail] = useState(lead.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  // Sync state when lead changes
  React.useEffect(() => {
    setNotes(lead.notes || '');
    setStatus(lead.status || 'new');
    setEmail(lead.email || '');
    
    // Auto-fetch email or re-check if failed
    const issues = JSON.parse(lead.website_issues || '[]');
    const hasFailed = issues.includes('check_failed') || lead.website_score === 0;
    
    if ((!lead.email || hasFailed) && lead.website && !isEnriching) {
      enrichEmail();
    }
  }, [lead]);

  const enrichEmail = async () => {
    setIsEnriching(true);
    try {
      const res = await axios.post(`/api/leads/${lead.id}/enrich`);
      if (res.data.email) {
        setEmail(res.data.email);
        onUpdate();
      }
    } catch (error) {
      console.log('No email found automatically');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.patch(`/api/leads/${lead.id}`, { notes, status, email });
      onUpdate();
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to update lead:', error);
      setIsSaving(false);
    }
  };

  const sendEmail = async () => {
    if (!email) {
      alert('No email found for this lead.');
      return;
    }
    try {
      await axios.post(`/api/outreach/email/${lead.id}`);
      onUpdate();
      alert('Email sent!');
    } catch (error) {
      alert('Failed to send email.');
    }
  };

  const queueWhatsApp = async () => {
    if (!lead.phone) {
      alert('No phone number found for this lead.');
      return;
    }
    try {
      const response = await axios.post(`/api/outreach/whatsapp/${lead.id}`);
      onUpdate();
      alert('WhatsApp message queued! Check the WhatsApp tab.');
    } catch (error) {
      alert('Failed to queue WhatsApp message.');
    }
  };

  const makeCall = async () => {
    if (!lead.phone) {
      alert('No phone number found for this lead.');
      return;
    }
    setIsCalling(true);
    try {
      await axios.post(`/api/voice/call/${lead.id}`);
      onUpdate();
      alert('Call initiated!');
    } catch (error) {
      alert('Failed to initiate call: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsCalling(false);
    }
  };

  const issues = JSON.parse(lead.website_issues || '[]');

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100 animate-slide-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{lead.business_name}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">City</p>
            <p className="font-semibold text-gray-800">{lead.city}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Niche</p>
            <p className="font-semibold text-gray-800 capitalize">{lead.niche}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Phone</p>
            <p className="font-semibold text-gray-800">{lead.phone || 'None'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Email</p>
            <div className="flex items-center gap-2">
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isEnriching ? "Searching for email..." : "Enter email..."}
                className={`w-full bg-transparent font-semibold outline-none border-b border-transparent focus:border-indigo-500 ${isEnriching ? 'text-indigo-500 italic' : 'text-gray-800'}`}
              />
              {isEnriching && <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin" />}
            </div>
          </div>
        </div>

        {/* Website Score */}
        {lead.website_score !== null && (
          <div className="mb-8 p-4 border border-gray-100 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Website Quality Score</h3>
              <span className={`text-2xl font-black ${lead.website_score < 45 ? 'text-red-500' : 'text-yellow-500'}`}>
                {lead.website_score}/100
              </span>
            </div>
            <div className="space-y-2">
              {issues.map((issue, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="capitalize">{issue.replace(/_/g, ' ')}</span>
                </div>
              ))}
              {issues.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>No major issues found</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4 mb-8">
          <h3 className="font-bold text-gray-800">Quick Outreach</h3>
          <div className={`grid ${email ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
            {email && (
              <button 
                onClick={sendEmail}
                className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg font-bold transition bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Mail className="w-5 h-5" /> 
                <span className="text-xs">Email</span>
              </button>
            )}
            <button 
              onClick={queueWhatsApp}
              disabled={!lead.phone}
              title={!lead.phone ? "No phone number found for this lead." : "Queue WhatsApp message"}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg font-bold transition ${
                !lead.phone ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <MessageCircle className="w-5 h-5" /> 
              <span className="text-xs">WhatsApp</span>
            </button>
            <button 
              onClick={makeCall}
              disabled={!lead.phone || isCalling}
              title={!lead.phone ? "No phone number found for this lead." : "Make AI voice call"}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg font-bold transition ${
                !lead.phone ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              <Phone className="w-5 h-5" /> 
              <span className="text-xs">{isCalling ? 'Calling...' : 'Call'}</span>
            </button>
          </div>
          <a 
            href={lead.demo_page_path} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-bold transition"
          >
            <ExternalLink className="w-4 h-4" /> Preview Demo Site
          </a>
        </div>

        {/* CRM Form */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800">Management</h3>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="new">New Lead</option>
              <option value="emailed">Email Sent</option>
              <option value="whatsapped">WhatsApp Queued</option>
              <option value="contacted">Contacted</option>
              <option value="replied">Replied</option>
              <option value="closed">Closed / Deal Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notes</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add some notes about this business..."
              className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            ></textarea>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-bold transition"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
