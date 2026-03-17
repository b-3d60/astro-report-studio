import { useEffect, useCallback, useRef } from 'react';
import { Report } from '../types';

const SERVER_URL = 'http://localhost:3001/api';

export const useServerSync = (
  reports: Report[],
  setReports: (reports: Report[]) => void
) => {
  const initialLoadDoneRef = useRef(false);

  // Lade Reports beim Start
  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/reports`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setReports(data);
          }
        }
      } catch (error) {
        console.warn('⚠️ Server nicht erreichbar, verwende lokale Daten');
      } finally {
        initialLoadDoneRef.current = true;
      }
    };

    loadReports();
  }, []);

  // Speichere Reports wenn sie sich ändern (mit Debouncing)
  useEffect(() => {
    if (!initialLoadDoneRef.current) return;

    const timeout = setTimeout(async () => {
      if (reports.length === 0) return;

      try {
        const areEqual = (a: Report, b: Report) => JSON.stringify(a) === JSON.stringify(b);

        // Lade aktuellen Server-Stand
        const existing = await fetch(`${SERVER_URL}/reports`);
        if (!existing.ok) {
          console.warn('⚠️ Server-Sync: Konnte vorhandene Reports nicht laden');
          return;
        }
        const existingData = await existing.json();

        // Keine Änderungen -> keine Schreibzugriffe
        if (
          Array.isArray(existingData) &&
          existingData.length === reports.length &&
          reports.every((report) => {
            const serverReport = existingData.find((r: Report) => r.id === report.id);
            return serverReport && areEqual(serverReport, report);
          })
        ) {
          return;
        }
        
        // Speichere neue Reports
        for (const report of reports) {
          const exists = existingData.find((r: Report) => r.id === report.id);
          if (exists) {
            if (areEqual(exists, report)) continue;
            await fetch(`${SERVER_URL}/reports/${report.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(report),
            });
          } else {
            await fetch(`${SERVER_URL}/reports`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(report),
            });
          }
        }

        // Lösche gelöschte Reports
        for (const existing of existingData) {
          if (!reports.find((r: Report) => r.id === existing.id)) {
            await fetch(`${SERVER_URL}/reports/${existing.id}`, {
              method: 'DELETE',
            });
          }
        }

        console.log('✅ Reports auf Server gespeichert');
      } catch (error) {
        console.warn('⚠️ Sync mit Server fehlgeschlagen');
      }
    }, 1000); // Debounce 1 Sekunde

    return () => clearTimeout(timeout);
  }, [reports]);
};

export const deleteReportFromServer = async (id: string) => {
  try {
    await fetch(`${SERVER_URL}/reports/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.error('Fehler beim Löschen vom Server');
  }
};
