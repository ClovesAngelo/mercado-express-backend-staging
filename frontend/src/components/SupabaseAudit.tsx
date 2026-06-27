import { useState } from 'react';
import { auditSupabaseConfig } from '../services/supabase';

export default function SupabaseAudit() {
  const [running, setRunning] = useState(false);

  const runAudit = async () => {
    setRunning(true);
    console.clear();
    
    try {
      await auditSupabaseConfig();
      alert('Auditoria concluída! Verifique o console (F12) para o relatório completo.');
    } catch (error) {
      console.error('Erro na auditoria:', error);
      alert('Erro ao executar auditoria. Verifique o console.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={runAudit}
        disabled={running}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium disabled:bg-gray-400"
      >
        {running ? 'Executando...' : '🔍 Auditar Supabase'}
      </button>
    </div>
  );
}