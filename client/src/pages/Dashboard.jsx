import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatsRow from '../components/StatsRow';
import LeadsTable from '../components/LeadsTable';
import LeadDetailPanel from '../components/LeadDetailPanel';
import ActivityFeed from '../components/ActivityFeed';
import PipelineBar from '../components/PipelineBar';
import { Search, Play, RefreshCw, Layers } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [leads, setLeads] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [activity, setActivity] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [botLog, setBotLog] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    checkBotStatus();
    fetchGroups();
    const interval = setInterval(checkBotStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get('/api/bot/groups');
      setGroups(res.data);
      if (res.data.length > 0) setSelectedGroup(res.data[0].id);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    console.log('Fetching all dashboard data...');
    try {
      const statsRes = await axios.get('/api/stats').catch(e => ({ data: {}, error: e }));
      const leadsRes = await axios.get('/api/leads').catch(e => ({ data: [], error: e }));
      const pipelineRes = await axios.get('/api/stats/pipeline').catch(e => ({ data: [], error: e }));
      const activityRes = await axios.get('/api/stats/activity').catch(e => ({ data: [], error: e }));

      if (statsRes.error) console.error('Stats fetch error:', statsRes.error);
      if (leadsRes.error) console.error('Leads fetch error:', leadsRes.error);
      if (pipelineRes.error) console.error('Pipeline fetch error:', pipelineRes.error);
      if (activityRes.error) console.error('Activity fetch error:', activityRes.error);

      setStats(statsRes.data || {});
      setLeads(leadsRes.data || []);
      setPipeline(pipelineRes.data || []);
      setActivity(activityRes.data || []);
      
      console.log(`Fetched ${leadsRes.data?.length || 0} leads successfully.`);
      setLoading(false);
    } catch (error) {
      console.error('Critical failure in fetchData:', error);
      setLoading(false);
    }
  };

  const checkBotStatus = async () => {
    try {
      const res = await axios.get('/api/bot/status');
      setIsBotRunning(res.data.running);
      setBotLog(res.data.log);
      // If bot just finished, refresh leads
      if (isBotRunning && !res.data.running) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to check bot status:', error);
    }
  };

  const runBot = async () => {
    try {
      await axios.post('/api/bot/run', { group: selectedGroup });
      setIsBotRunning(true);
      alert(`Bot started searching for leads in ${selectedGroup.replace(/_/g, ' ').toUpperCase()}!`);
    } catch (error) {
      alert('Bot is already running or failed to start.');
    }
  };

  const handleDeleteAllLeads = async () => {
    if (!window.confirm('Are you sure you want to delete ALL leads? This cannot be undone.')) return;
    try {
      await axios.delete('/api/leads');
      fetchData();
    } catch (error) {
      console.error('Failed to delete leads:', error);
      alert('Failed to delete leads');
    }
  };

  const handleBatchEmail = async () => {
    if (!window.confirm('Send batch emails to all leads without contact?')) return;
    try {
      setLoading(true);
      const res = await axios.post('/api/outreach/batch-email');
      alert(res.data.message);
      fetchData();
    } catch (error) {
      console.error('Failed to send batch emails:', error);
      alert('Failed to send batch emails');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchWhatsApp = async () => {
    if (!window.confirm('Queue batch WhatsApp messages for all leads without contact?')) return;
    try {
      setLoading(true);
      const res = await axios.post('/api/outreach/batch-whatsapp');
      alert(res.data.message);
      fetchData();
    } catch (error) {
      console.error('Failed to queue batch WhatsApp:', error);
      alert('Failed to queue batch WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Demitech Bot</h1>
          <p className="text-gray-500 font-medium">Automated lead finder for Tebogo.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            disabled={isBotRunning}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-semibold text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
          >
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.label} ({group.cityCount} Cities)
              </option>
            ))}
          </select>
          <button 
            onClick={fetchData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-lg shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button 
            onClick={runBot}
            disabled={isBotRunning}
            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold shadow-sm transition ${
              isBotRunning 
              ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Play className={`w-4 h-4 ${isBotRunning ? 'animate-pulse' : ''}`} />
            {isBotRunning ? 'Bot is Running...' : 'Run Bot Now'}
          </button>
        </div>
      </div>

      <StatsRow 
        stats={stats} 
        onDeleteAll={handleDeleteAllLeads}
        onBatchEmail={handleBatchEmail}
        onBatchWhatsApp={handleBatchWhatsApp}
      />

      {/* Bot Logs - Show when running or has recent logs */}
      {(isBotRunning || botLog) && (
        <div className="mb-8 bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 max-h-40 overflow-y-auto shadow-inner border border-gray-800">
          <div className="flex items-center justify-between mb-2 border-b border-gray-800 pb-2">
            <span className="uppercase tracking-widest font-bold flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isBotRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
              Bot Terminal Output
            </span>
            <span className="text-gray-500">{isBotRunning ? 'RUNNING' : 'FINISHED'}</span>
          </div>
          <pre className="whitespace-pre-wrap">{botLog || 'Waiting for bot to start...'}</pre>
        </div>
      )}

      {/* Grid for Pipeline and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <PipelineBar pipeline={pipeline} />
        </div>
        <div>
          <ActivityFeed activities={activity} />
        </div>
      </div>

      {/* Leads Table Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            Recent Qualified Leads ({leads.length})
          </h2>
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="bg-transparent border-none outline-none text-sm w-48"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-gray-400 font-medium">Loading your leads...</p>
            </div>
          </div>
        ) : (
          <LeadsTable leads={leads} onSelectLead={setSelectedLead} />
        )}
      </div>

      {selectedLead && (
        <LeadDetailPanel 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}
