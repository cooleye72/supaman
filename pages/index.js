import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Head from 'next/head';

export default function SupaMan() {
  const [missions, setMissions] = useState([]);
  const [newMission, setNewMission] = useState({ title: '', description: '' });

  // 1. Fetch existing missions and listen for real-time updates
  useEffect(() => {
    fetchMissions();

    const channel = supabase
      .channel('realtime-missions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMissions((prev) => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchMissions = async () => {
    const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
    if (data) setMissions(data);
  };

  // 2. Function to "Dispatch" (Insert) a new mission
  const dispatchMission = async (e) => {
    e.preventDefault();
    if (!newMission.title) return;

    const { error } = await supabase.from('missions').insert([
      { title: newMission.title, description: newMission.description, status: 'pending' }
    ]);

    if (!error) setNewMission({ title: '', description: '' });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-6">
      <Head>
        <title>SupaMan | Mission Control</title>
      </Head>

      <header className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-500">
          SupaMan Mission Control
        </h1>
        <p className="text-gray-400 mt-4">Powered by Supabase Realtime Engine</p>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* DISPATCH FORM */}
        <section className="md:col-span-1">
          <form onSubmit={dispatchMission} className="bg-gray-800 p-6 rounded-xl border border-gray-700 sticky top-6">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Dispatch Mission</h2>
            <input 
              className="w-full bg-gray-700 p-2 mb-3 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              placeholder="Mission Title"
              value={newMission.title}
              onChange={(e) => setNewMission({...newMission, title: e.target.value})}
            />
            <textarea 
              className="w-full bg-gray-700 p-2 mb-3 rounded border border-gray-600 h-24 focus:outline-none focus:border-blue-500"
              placeholder="Mission Details"
              value={newMission.description}
              onChange={(e) => setNewMission({...newMission, description: e.target.value})}
            />
            <button className="w-full bg-blue-600 hover:bg-blue-500 transition py-2 rounded font-bold uppercase tracking-widest">
              Send Hero 🚀
            </button>
          </form>
        </section>

        {/* LIVE FEED */}
        <section className="md:col-span-2">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Live Mission Feed
          </h2>
          
          <div className="space-y-4">
            {missions.length === 0 && <p className="text-gray-500">No active missions. Earth is safe... for now.</p>}
            {missions.map((mission) => (
              <div key={mission.id} className="bg-gray-800 p-5 rounded-lg border-l-4 border-blue-500 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-lg font-bold">{mission.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{mission.description}</p>
                <div className="mt-3 flex justify-between items-center text-xs">
                  <span className="text-gray-500">{new Date(mission.created_at).toLocaleTimeString()}</span>
                  <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded uppercase">{mission.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}