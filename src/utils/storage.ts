import type { WeightGroup } from '../types';

export interface StoredConfig {
  name: string;
  groups: WeightGroup[];
  timestamp: number;
}

export async function saveConfiguration(name: string, groups: WeightGroup[]): Promise<void> {
  if (!name || !groups?.length) {
    throw new Error('Invalid configuration data');
  }

  try {
    const response = await fetch('/api/configurations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.trim(),
        groups: groups.map(g => ({
          weight: Number(g.weight),
          count: Number(g.count)
        }))
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ details: 'Unbekannter Serverfehler' }));
      throw new Error(errorData.details || `Speichern fehlgeschlagen: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data) {
      throw new Error('Keine Daten vom Server erhalten');
    }
  } catch (error) {
    console.error('Konfiguration konnte nicht gespeichert werden:', error);
    throw new Error(error instanceof Error ? error.message : 'Speichern fehlgeschlagen');
  }
}

export async function loadConfigurations(): Promise<StoredConfig[]> {
  try {
    const response = await fetch('/api/configurations');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ details: 'Unbekannter Serverfehler' }));
      throw new Error(errorData.details || `Laden fehlgeschlagen: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Ungültiges Datenformat vom Server');
    }
    
    return data.map(config => ({
      name: String(config.name || '').trim(),
      groups: Array.isArray(config.groups) ? config.groups.map(g => ({
        weight: Number(g.weight),
        count: Number(g.count)
      })) : [],
      timestamp: Number(config.timestamp) || Date.now()
    }));
  } catch (error) {
    console.error('Konfigurationen konnten nicht geladen werden:', error);
    throw new Error(error instanceof Error ? error.message : 'Laden fehlgeschlagen');
  }
}

export async function deleteConfiguration(name: string): Promise<void> {
  if (!name) {
    throw new Error('Kein Konfigurationsname angegeben');
  }

  try {
    const response = await fetch(`/api/configurations/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ details: 'Unbekannter Serverfehler' }));
      throw new Error(errorData.details || `Löschen fehlgeschlagen: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data?.success) {
      throw new Error('Löschen fehlgeschlagen');
    }
  } catch (error) {
    console.error('Konfiguration konnte nicht gelöscht werden:', error);
    throw new Error(error instanceof Error ? error.message : 'Löschen fehlgeschlagen');
  }
}