import React from 'react';
import { Users, Mail, TrendingUp, MessageSquare, Trash2, Send, MessageCircle } from 'lucide-react';

export default function StatsRow({ stats, onDeleteAll, onBatchEmail, onBatchWhatsApp }) {
  const items = [
    { label: 'Total Leads', value: stats.totalLeads || 0, icon: Users, color: 'text-blue-600' },
    { label: 'New Today', value: stats.newToday || 0, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Emails Sent', value: stats.emailsSentToday || 0, icon: Mail, color: 'text-purple-600' },
    { label: 'Replies', value: stats.repliesReceived || 0, icon: MessageSquare, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{item.label}</p>
                <h3 className="text-2xl font-bold mt-1">{item.value}</h3>
              </div>
              <item.icon className={`w-8 h-8 ${item.color} opacity-80`} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onDeleteAll}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg transition border border-red-100"
        >
          <Trash2 className="w-4 h-4" />
          Delete All Leads
        </button>
        <button
          onClick={onBatchEmail}
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold rounded-lg transition border border-purple-100"
        >
          <Send className="w-4 h-4" />
          Batch Email Outreach
        </button>
        <button
          onClick={onBatchWhatsApp}
          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 font-bold rounded-lg transition border border-green-100"
        >
          <MessageCircle className="w-4 h-4" />
          Batch WhatsApp Outreach
        </button>
      </div>
    </div>
  );
}