import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';

export default function WhatsApp() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/outreach/queue');
      setQueue(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch WhatsApp queue:', error);
      setLoading(false);
    }
  };

  const copyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const markAsSent = async (id) => {
    try {
      await axios.patch(`/api/outreach/queue/${id}/sent`);
      setQueue(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      alert('Failed to mark as sent.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-green-500" />
            WhatsApp Queue
          </h1>
          <p className="text-gray-500 font-medium">Messages ready to be sent manually.</p>
        </div>
        <button 
          onClick={fetchQueue}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {queue.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Queue is empty!</h3>
            <p className="text-gray-500">Go to the Dashboard to add leads to the queue.</p>
          </div>
        ) : (
          queue.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{item.business_name}</h3>
                  <p className="text-gray-500 font-medium">{item.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition"
                  >
                    <ExternalLink className="w-4 h-4" /> Open WA
                  </a>
                  <button 
                    onClick={() => markAsSent(item.id)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm transition"
                  >
                    Mark as Sent
                  </button>
                </div>
              </div>
              
              <div className="relative bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-gray-800 text-sm leading-relaxed pr-10">{item.message}</p>
                <button 
                  onClick={() => copyToClipboard(item.id, item.message)}
                  className="absolute top-3 right-3 p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition"
                  title="Copy message"
                >
                  {copiedId === item.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
