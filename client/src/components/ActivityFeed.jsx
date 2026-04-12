import React from 'react';
import { Mail, MessageCircle, UserPlus, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityFeed({ activities }) {
  const getIcon = (channel) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4 text-blue-500" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-500" />;
      default: return <UserPlus className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-400" />
        Recent Activity
      </h3>
      <div className="space-y-6">
        {activities.length === 0 ? (
          <p className="text-gray-400 text-sm italic">No recent activity</p>
        ) : (
          activities.map((activity, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="mt-1 p-2 bg-gray-50 rounded-lg shrink-0">
                {getIcon(activity.channel)}
              </div>
              <div className="flex-1 border-b border-gray-50 pb-4 last:border-0">
                <p className="text-sm font-bold text-gray-900">
                  {activity.channel === 'email' ? 'Email sent to ' : 'Contacted '}
                  <span className="text-indigo-600">{activity.business_name}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
