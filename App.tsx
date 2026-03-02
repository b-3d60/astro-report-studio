import React, { useState, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy,
  Code, 
  Download,
  Settings,
  FileText,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Edit2,
} from 'lucide-react';
import { Report, Chapter, ReportType } from './types';
import BlockEditor from './components/BlockEditor';

const App: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState<string | null>(null);

  const activeReport = reports.find(r => r.id === activeReportId);
  const activeChapter = activeReport?.chapters.find(c => c.id === activeChapterId);

  // ============================================================================
  // Report Management
  // ============================================================================

  const createNewReport = useCallback((type: ReportType) => {
    const reportId = `report-${Date.now()}`;
    const chapterId = `chapter-${Date.now()}`;

    const newReport: Report = {
      id: reportId,
      title: type === 'bericht' ? 'Neuer Bericht' : 'Neues Dossier',
      chapters: [
        {
          id: chapterId,
          title: 'Erstes Kapitel',
          blocks: [],
        }
      ],
      settings: {
        title: type === 'bericht' ? 'Neuer Bericht' : 'Neues Dossier',
        reportType: type,
        paperFormat: 'A4',
        orientation: 'portrait',
        marginTop: 20,
        marginBottom: 20,
        marginLeft: 15,
        marginRight: 15,
        fontFamily: "'Inter', sans-serif",
        headingFontFamily: "'Inter', sans-serif",
        baseFontSize: 16,
        accentColor: '#3b82f6',
        textColor: '#1a1a1a',
        backgroundColor: '#ffffff',
        pageNumbering: true,
        headerFooterEnabled: true,
        tocEnabled: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setReports([...reports, newReport]);
    setActiveReportId(reportId);
    setActiveChapterId(chapterId);
  }, [reports]);

  const deleteReport = useCallback((id: string) => {
    setReports(reports.filter(r => r.id !== id));
    if (activeReportId === id) {
      setActiveReportId(null);
      setActiveChapterId(null);
    }
  }, [reports, activeReportId]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ===== SIDEBAR ===== */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Report Studio</h1>
          <p className="text-xs text-gray-500 mt-1">v0.0.1</p>
        </div>

        {/* New Report Buttons */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => createNewReport('bericht')}
            className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus size={18} />
            Bericht
          </button>
          <button
            onClick={() => createNewReport('dossier')}
            className="w-full flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
          >
            <Plus size={18} />
            Dossier
          </button>
        </div>

        {/* Reports List */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-4">
            Alle Reports
          </div>
          <div className="space-y-2">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => {
                  setActiveReportId(report.id);
                  setActiveChapterId(report.chapters[0]?.id || null);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition group ${
                  activeReportId === report.id
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {report.settings.reportType === 'bericht' ? (
                    <FileText size={14} />
                  ) : (
                    <BookOpen size={14} />
                  )}
                  <span className="truncate">{report.title}</span>
                  {activeReportId === report.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReport(report.id);
                      }}
                      className="ml-auto opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} className="text-red-600" />
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {report.chapters.length} Kapitel
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
          <p>© 2026 Astro Report Studio</p>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col">
        {activeReport ? (
          <>
            {/* ===== HEADER ===== */}
            <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{activeReport.title}</h2>
                <p className="text-xs text-gray-500">
                  {activeReport.settings.reportType === 'bericht' ? 'Bericht' : 'Dossier'} • {activeReport.chapters.length} Kapitel
                </p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                  <Download size={16} />
                  PDF
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium flex items-center gap-2">
                  <Code size={16} />
                  Astro
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {/* ===== EDITOR AREA ===== */}
            <div className="flex-1 flex overflow-hidden">
              {/* CHAPTERS PANEL */}
              <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Kapitel</h3>
                  <button
                    onClick={handleAddChapter}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Kapitel hinzufügen"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-1">
                  {activeReport.chapters.map((chapter, idx) => (
                    <div
                      key={chapter.id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded transition ${
                        activeChapterId === chapter.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <button
                        onClick={() => setActiveChapterId(chapter.id)}
                        className="flex-1 text-left text-sm"
                      >
                        {editingChapterTitle === chapter.id ? (
                          <input
                            autoFocus
                            defaultValue={chapter.title}
                            onBlur={e => handleRenameChapter(chapter.id, e.currentTarget.value || chapter.title)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleRenameChapter(chapter.id, (e.currentTarget as HTMLInputElement).value || chapter.title);
                              }
                            }}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        ) : (
                          <>
                            <div className={`font-medium ${activeChapterId === chapter.id ? 'text-blue-900' : 'text-gray-900'}`}>
                              {chapter.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {chapter.blocks.length} Blöcke
                            </div>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setEditingChapterTitle(chapter.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                        title="Umbenennen"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chapter.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-red-600 rounded"
                        title="Löschen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* CANVAS AREA */}
              <div className="flex-1 p-8 overflow-auto bg-gray-50">
                {activeChapter ? (
                  <div className="max-w-3xl mx-auto">
                    {/* Chapter Title */}
                    <div className="mb-8">
                      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Kapitel
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900">{activeChapter.title}</h2>
                    </div>

                    {/* Canvas (White Background) */}
                    <div className="bg-white rounded-lg shadow-sm p-12">
                      {/* Block Editor */}
                      <BlockEditor
                        chapter={activeChapter}
                        onBlocksChange={blocks =>
                          handleBlocksChange(activeChapter.id, blocks)
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Kein Kapitel ausgewählt</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ===== EMPTY STATE ===== */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine Reports vorhanden
              </h3>
              <p className="text-gray-500 mb-6">
                Erstelle einen neuen Bericht oder ein Dossier, um zu starten
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => createNewReport('bericht')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Bericht erstellen
                </button>
                <button
                  onClick={() => createNewReport('dossier')}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                >
                  Dossier erstellen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}               <h3 className="text-sm font-semibold text-gray-900">Kapitel</h3>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-1">
                  {activeReport.chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => setActiveChapterId(chapter.id)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                        activeChapterId === chapter.id
                          ? 'bg-blue-50 text-blue-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {chapter.title}
                      <div className="text-xs text-gray-500 mt-0.5">
                        {chapter.blocks.length} Blöcke
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Canvas Area */}
              <div className="flex-1 p-8 overflow-auto">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-12 min-h-[400px]">
                  {activeChapterId && activeReport.chapters.find(c => c.id === activeChapterId) && (
                    <div>
                      <h4 className="text-xl font-bold mb-6">
                        {activeReport.chapters.find(c => c.id === activeChapterId)?.title}
                      </h4>
                      <div className="text-gray-500 text-center py-12">
                        <p>Editor wird noch aufgebaut...</p>
                        <p className="text-sm mt-2">Hier können die Report-Blöcke bearbeitet werden</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine Reports vorhanden
              </h3>
              <p className="text-gray-500 mb-6">
                Erstelle einen neuen Bericht oder ein Dossier, um zu starten
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => createNewReport('bericht')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Bericht erstellen
                </button>
                <button
                  onClick={() => createNewReport('dossier')}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                >
                  Dossier erstellen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
