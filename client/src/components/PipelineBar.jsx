import React from 'react';

export default function PipelineBar({ pipeline }) {
  const statuses = [
    { label: 'New', value: 'new', color: 'bg-gray-200' },
    { label: 'Emailed', value: 'emailed', color: 'bg-blue-400' },
    { label: 'WhatsApp', value: 'whatsapped', color: 'bg-green-400' },
    { label: 'Replied', value: 'replied', color: 'bg-indigo-400' },
    { label: 'Closed', value: 'closed', color: 'bg-emerald-500' },
  ];

  const total = pipeline.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Pipeline Overview</h3>
      <div className="h-4 w-full bg-gray-100 rounded-full flex overflow-hidden mb-6">
        {statuses.map((status) => {
          const item = pipeline.find(p => p.status === status.value);
          const count = item ? item.count : 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <div 
              key={status.value} 
              className={`h-full ${status.color} transition-all duration-500`} 
              style={{ width: `${percentage}%` }}
              title={`${status.label}: ${count}`}
            ></div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statuses.map((status) => {
          const item = pipeline.find(p => p.status === status.value);
          const count = item ? item.count : 0;
          return (
            <div key={status.value} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
              <div>
                <p className="text-xs font-bold text-gray-500">{status.label}</p>
                <p className="text-sm font-black text-gray-900">{count}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
