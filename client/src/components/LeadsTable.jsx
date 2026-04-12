import React from 'react';
import { ExternalLink, MoreVertical, CheckCircle, XCircle, Clock, Mail, MessageCircle, Phone } from 'lucide-react';
import { format } from 'date-fns';

export default function LeadsTable({ leads, onSelectLead }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'emailed': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'whatsapped': return <Clock className="w-4 h-4 text-green-500" />;
      case 'contacted': return <CheckCircle className="w-4 h-4 text-indigo-500" />;
      case 'replied': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'lost': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <div className="w-2 h-2 rounded-full bg-gray-300 ml-1" />;
    }
  };

  const ContactBadges = ({ lead }) => {
    return (
      <div className="flex gap-1 mt-1">
        {lead.email_sent === 1 && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold border border-blue-100" title="Emailed">
            <Mail className="w-2.5 h-2.5" /> Emailed ✅
          </span>
        )}
        {lead.whatsapp_sent === 1 && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-600 rounded-md text-[10px] font-bold border border-green-100" title="WhatsApped">
            <MessageCircle className="w-2.5 h-2.5" /> WhatsApp ✅
          </span>
        )}
        {lead.call_status && (
          <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
            lead.call_status === 'interested' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            lead.call_status === 'not_interested' ? 'bg-red-50 text-red-600 border-red-100' :
            lead.call_status === 'no_response' ? 'bg-gray-50 text-gray-600 border-gray-100' :
            'bg-orange-50 text-orange-600 border-orange-100'
          }`} title={`Call: ${lead.call_status}`}>
            <Phone className="w-2.5 h-2.5" /> {lead.call_status === 'interested' ? 'Interested ✅' : lead.call_status === 'calling' ? 'Calling...' : 'Called ✅'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Business Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Niche</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">City</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Lead Type</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Website Score</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  No leads found. Select a region and click "Run Bot Now" to find leads.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => onSelectLead(lead)}
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{lead.business_name}</div>
                    <div className="text-xs text-gray-500 mt-1">{lead.phone}</div>
                    <ContactBadges lead={lead} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs capitalize">
                      {lead.niche}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.city}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      lead.lead_type === 'no_website' ? 'bg-red-50 text-red-600' : 
                      lead.lead_type === 'outdated_website' ? 'bg-orange-50 text-orange-600' :
                      'bg-indigo-50 text-indigo-600'
                    }`}>
                      {lead.lead_type === 'no_website' ? 'No Website' : 
                       lead.lead_type === 'outdated_website' ? 'Outdated Website' : 
                       'Needs App'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700 capitalize">
                      {getStatusIcon(lead.status)}
                      {lead.status}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {lead.website_score !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${lead.website_score < 45 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                            style={{ width: `${lead.website_score}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold">{lead.website_score}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-gray-200 rounded-full transition">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
