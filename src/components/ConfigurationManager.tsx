import React, { useState, useEffect } from 'react';
import { Save, Trash2, AlertCircle } from 'lucide-react';
import type { WeightGroup } from '../types';
import { saveConfiguration, loadConfigurations, deleteConfiguration, type StoredConfig } from '../utils/storage';

interface Props {
  groups: WeightGroup[];
  onLoadConfig: (groups: WeightGroup[]) => void;
}

export function ConfigurationManager({ groups, onLoadConfig }: Props) {
  const [configName, setConfigName] = useState('');
  const [savedConfigs, setSavedConfigs] = useState<StoredConfig[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSavedConfigurations();
  }, []);

  const loadSavedConfigurations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const configs = await loadConfigurations();
      setSavedConfigs(configs.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Konfigurationen');
      setSavedConfigs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = configName.trim();
    if (!trimmedName) {
      setError('Bitte geben Sie einen Namen für die Konfiguration ein');
      return;
    }

    if (!groups.length) {
      setError('Keine Gruppen zum Speichern vorhanden');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await saveConfiguration(trimmedName, groups);
      await loadSavedConfigurations();
      setConfigName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern der Konfiguration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await deleteConfiguration(name);
      await loadSavedConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen der Konfiguration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = (config: StoredConfig) => {
    try {
      setError(null);
      if (!config.groups?.length) {
        throw new Error('Keine gültigen Gruppen in der Konfiguration');
      }
      onLoadConfig(config.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Konfiguration');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-md animate-shake">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      <div className="flex gap-2">
        <input
          type="text"
          value={configName}
          onChange={(e) => setConfigName(e.target.value)}
          placeholder="Name der Konfiguration"
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
          disabled={isLoading}
        />
        <button
          onClick={handleSave}
          disabled={isLoading || !configName.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
        >
          <Save className="w-4 h-4" />
          Speichern
        </button>
      </div>

      {savedConfigs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Gespeicherte Konfigurationen</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {savedConfigs.map((config) => (
              <div
                key={`${config.name}-${config.timestamp}`}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md hover:border-blue-300 transition-colors duration-200"
              >
                <div>
                  <div className="font-medium text-gray-900">{config.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(config.timestamp).toLocaleString('de-DE')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoad(config)}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded transition-colors duration-200"
                  >
                    Laden
                  </button>
                  <button
                    onClick={() => handleDelete(config.name)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-800 p-1 rounded transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}