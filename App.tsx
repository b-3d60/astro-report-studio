import React, { useState, useCallback } from 'react';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { Report, Chapter, ReportType, ReportBlock } from './types';
import BlockEditor from './components/BlockEditor.tsx';
import { useServerSync, deleteReportFromServer } from './hooks/useServerSync';

const App: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'layout' | 'design' | 'branding' | 'storage'>('general');

  const activeReport = reports.find(r => r.id === activeReportId);
  const activeChapter = activeReport?.chapters.find(c => c.id === activeChapterId);

  // ============================================================================
  // Server Synchronization
  // ============================================================================
  useServerSync(reports, setReports);

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
          title: 'First Chapter',
          blocks: [],
        }
      ],
      settings: {
        title: type === 'bericht' ? 'Neuer Bericht' : 'Neues Dossier',
        reportType: type,
        author: '',
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
        coverPageEnabled: true,
        layoutVariant: 'default',
        tocPosition: 'after-cover',
        sidebarBrandLine1: 're:think yachting',
        sidebarBrandLine2: 'report & dossier studio',
        sidebarFooterText: 're:think yachting UG - Hamburg',
        reportFooterText: 'Mastery re:engineered.',
        storageConfig: {
                projectId: '',
                bucketName: '',
                region: 'europe-west3',
                enabled: false,
              },
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
    deleteReportFromServer(id);
    if (activeReportId === id) {
      setActiveReportId(null);
      setActiveChapterId(null);
    }
  }, [reports, activeReportId]);

  const updateReportMetadata = useCallback((updates: Partial<Pick<Report, 'title' | 'description'>>) => {
    if (!activeReportId) return;
    setReports(reports.map(r => 
      r.id === activeReportId 
        ? { ...r, ...updates, updatedAt: new Date().toISOString() } 
        : r
    ));
  }, [reports, activeReportId]);

  const updateReportSettings = useCallback((updates: Partial<Report['settings']>) => {
    if (!activeReportId) return;
    setReports(reports.map(r => 
      r.id === activeReportId 
        ? { 
            ...r, 
            settings: { ...r.settings, ...updates },
            updatedAt: new Date().toISOString() 
          } 
        : r
    ));
  }, [reports, activeReportId]);

  // ============================================================================
  // Chapter Management
  // ============================================================================

  const handleAddChapter = useCallback(() => {
    if (!activeReport) return;

    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: `Chapter ${activeReport.chapters.length + 1}`,
      blocks: [],
    };

    const updated = {
      ...activeReport,
      chapters: [...activeReport.chapters, newChapter],
      updatedAt: new Date().toISOString(),
    };

    setReports(reports.map(r => r.id === activeReport.id ? updated : r));
    setActiveChapterId(newChapter.id);
  }, [activeReport, reports]);
  // ============================================================================
  // File Upload & Storage
  // ============================================================================

  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);

  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });

  const uploadFileAndGetUrl = async (file: File, folder: string): Promise<string> => {
    const storageConfig = activeReport?.settings.storageConfig;

    if (!storageConfig?.enabled) {
      return fileToDataUrl(file);
    }

    if (!storageConfig.projectId || !storageConfig.bucketName || !storageConfig.apiKey) {
      throw new Error('Cloud Storage is enabled, but Project ID, Bucket Name or API Key is missing.');
    }

    const authDomain = storageConfig.authDomain || `${storageConfig.projectId}.firebaseapp.com`;
    const appName = `astro-report-${storageConfig.projectId}-${storageConfig.bucketName}`.replace(/[^a-zA-Z0-9-]/g, '-');
    const app = getApps().some(existing => existing.name === appName)
      ? getApp(appName)
      : initializeApp({
          apiKey: storageConfig.apiKey,
          authDomain,
          projectId: storageConfig.projectId,
          storageBucket: storageConfig.bucketName,
        }, appName);

    const storage = getStorage(app);
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    const objectPath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const objectRef = storageRef(storage, objectPath);

    await uploadBytes(objectRef, file, file.type ? { contentType: file.type } : undefined);
    return getDownloadURL(objectRef);
  };

  const handleImageUpload = async (chapterId: string, blockId: string, file: File) => {
    setUploadingBlockId(blockId);
    try {
      const result = await uploadFileAndGetUrl(file, 'report-images');
      
      // Update the block with the uploaded image URL
      if (!activeReport) return;
      
      const updated = {
        ...activeReport,
        chapters: activeReport.chapters.map(c => {
          if (c.id === chapterId) {
            return {
              ...c,
              blocks: c.blocks.map(b =>
                b.id === blockId
                  ? { ...b, metadata: { ...b.metadata, src: result } }
                  : b
              ),
            };
          }
          return c;
        }),
        updatedAt: new Date().toISOString(),
      };

      setReports(reports.map(r => r.id === activeReport.id ? updated : r));
      setUploadingBlockId(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Image upload failed.');
      setUploadingBlockId(null);
    }
  };


  const handleDeleteChapter = useCallback((chapterId: string) => {
    if (!activeReport || activeReport.chapters.length <= 1) return;

    const updated = {
      ...activeReport,
      chapters: activeReport.chapters.filter(c => c.id !== chapterId),
      updatedAt: new Date().toISOString(),
    };

    setReports(reports.map(r => r.id === activeReport.id ? updated : r));
    
    if (activeChapterId === chapterId) {
      setActiveChapterId(updated.chapters[0]?.id || null);
    }
  }, [activeReport, activeChapterId, reports]);

  const handleRenameChapter = useCallback((chapterId: string, newTitle: string) => {
    if (!activeReport) return;

    const updated = {
      ...activeReport,
      chapters: activeReport.chapters.map(c =>
        c.id === chapterId ? { ...c, title: newTitle } : c
      ),
      updatedAt: new Date().toISOString(),
    };

    setReports(reports.map(r => r.id === activeReport.id ? updated : r));
    setEditingChapterTitle(null);
  }, [activeReport, reports]);

  // ============================================================================
  // Block Management
  // ============================================================================

  const handleBlocksChange = useCallback((chapterId: string, blocks: any[]) => {
    if (!activeReport) return;

    const updated = {
      ...activeReport,
      chapters: activeReport.chapters.map(c =>
        c.id === chapterId ? { ...c, blocks } : c
      ),
      updatedAt: new Date().toISOString(),
    };

    setReports(reports.map(r => r.id === activeReport.id ? updated : r));
  }, [activeReport, reports]);

  // ============================================================================
  // Export (HTML / PDF)
  // ============================================================================

  const escapeHtml = (value: string): string => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const toSafeFileName = (value: string): string =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase() || 'report';

  const renderBlockHtml = (block: ReportBlock): string => {
    const content = escapeHtml(block.content || '');

    switch (block.type) {
      case 'h1':
        return `<h1>${content}</h1>`;
      case 'h2':
        return `<h2>${content}</h2>`;
      case 'h3':
        return `<h3>${content}</h3>`;
      case 'text':
        return `<p>${content.replace(/\n/g, '<br/>')}</p>`;
      case 'highlight': {
        const color = block.metadata?.highlightColor || '#f59e0b';
        const icon = escapeHtml(block.metadata?.highlightIcon || '💡');
        return `<div class="highlight" style="border-left-color:${color};background:${color}22;"><span class="icon">${icon}</span><div>${content.replace(/\n/g, '<br/>')}</div></div>`;
      }
      case 'bullets': {
        const lines = block.content.split('\n').map((line) => line.trim()).filter(Boolean);
        const listTag = block.metadata?.listStyle === 'numbered' ? 'ol' : 'ul';
        return `<${listTag}>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</${listTag}>`;
      }
      case 'quote-block':
        return `<blockquote>${content.replace(/\n/g, '<br/>')}</blockquote>`;
      case 'citation': {
        const author = block.metadata?.citationAuthor ? `<cite>${escapeHtml(block.metadata.citationAuthor)}</cite>` : '';
        return `<figure class="citation"><blockquote>${content.replace(/\n/g, '<br/>')}</blockquote>${author}</figure>`;
      }
      case 'image': {
        const src = block.metadata?.src || '';
        if (!src) return '';
        const caption = block.metadata?.caption ? `<figcaption>${escapeHtml(block.metadata.caption)}</figcaption>` : '';
        return `<figure><img src="${escapeHtml(src)}" alt="" />${caption}</figure>`;
      }
      case 'gallery': {
        const images = block.metadata?.images || [];
        if (images.length === 0) return '';
        return `<div class="gallery">${images.map((img) => `<figure><img src="${escapeHtml(img.src)}" alt="" />${img.caption ? `<figcaption>${escapeHtml(img.caption)}</figcaption>` : ''}</figure>`).join('')}</div>`;
      }
      case 'divider':
        return '<hr/>';
      case 'spacer': {
        const height = Math.max(8, Math.min(400, Number(block.metadata?.fontSize || 40)));
        return `<div style="height:${height}px"></div>`;
      }
      case 'button': {
        const text = escapeHtml(block.metadata?.buttonText || 'Button');
        const link = escapeHtml(block.metadata?.buttonLink || '#');
        return `<p><a class="button" href="${link}">${text}</a></p>`;
      }
      case 'link': {
        const link = escapeHtml(block.metadata?.link || '#');
        const text = content || 'Link';
        return `<p><a href="${link}">${text}</a></p>`;
      }
      case 'cta': {
        const title = escapeHtml(block.metadata?.title || 'Ready to start?');
        const description = escapeHtml(block.metadata?.description || 'Contact us today.');
        const text = escapeHtml(block.metadata?.buttonText || 'Get Started');
        const link = escapeHtml(block.metadata?.buttonLink || '#');
        return `<section class="cta"><h3>${title}</h3><p>${description}</p><p><a class="button" href="${link}">${text}</a></p></section>`;
      }
      case 'faq': {
        const faqItems = block.metadata?.faqItems || [];
        if (faqItems.length === 0) return '';
        return `<section class="faq">${faqItems.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer).replace(/\n/g, '<br/>')}</p></details>`).join('')}</section>`;
      }
      case 'table': {
        const rows = block.metadata?.tableData || [];
        if (rows.length === 0) return '';
        return `<table>${rows.map((row, rowIndex) => `<tr>${row.map((cell) => rowIndex === 0 && block.metadata?.tableHeader ? `<th>${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</table>`;
      }
      case 'metrics': {
        const metrics = block.metadata?.metricsData || [];
        if (metrics.length === 0) return '';
        return `<div class="metrics">${metrics.map((metric) => `<div class="metric"><div class="metric-value">${escapeHtml(metric.value)}</div><div class="metric-label">${escapeHtml(metric.label)}</div></div>`).join('')}</div>`;
      }
      case 'timeline': {
        const timeline = block.metadata?.timelineItems || [];
        if (timeline.length === 0) return '';
        return `<div class="timeline">${timeline.map((item) => `<div class="timeline-item"><div class="timeline-date">${escapeHtml(item.date)}</div><div><div class="timeline-title">${escapeHtml(item.title)}</div><div>${escapeHtml(item.description)}</div></div></div>`).join('')}</div>`;
      }
      case 'database': {
        const items = block.metadata?.dbItems || [];
        return `<section><h4>${escapeHtml(block.metadata?.collectionName || 'Collection')}</h4><div>${items.map((item) => `<article><h5>${escapeHtml(item.title)}</h5><p>${escapeHtml(item.description)}</p></article>`).join('')}</div></section>`;
      }
      case 'video': {
        const src = block.metadata?.src;
        if (!src) return '';
        return `<div class="embed-wrapper"><iframe src="${escapeHtml(src)}" title="Video" loading="lazy" allowfullscreen></iframe></div>`;
      }
      case 'embed': {
        const src = block.metadata?.src;
        if (!src) return '';
        const width = Math.max(240, Math.min(2400, Number(block.metadata?.embedWidth || 1000)));
        const height = Math.max(180, Math.min(1800, Number(block.metadata?.embedHeight || 420)));
        return `<div class="embed-wrapper"><iframe src="${escapeHtml(src)}" title="Embed" loading="lazy" style="width:${width}px;height:${height}px;max-width:100%"></iframe></div>`;
      }
      case 'columns': {
        const count = block.metadata?.columnCount || 2;
        const columns = Array.from({ length: count }, (_, idx) => block.metadata?.columns?.[idx] || []);
        return `<div class="columns columns-${count}">${columns.map((column) => `<div class="column">${column.map(renderBlockHtml).join('')}</div>`).join('')}</div>`;
      }
      case 'container': {
        const blocks = block.metadata?.containerBlocks || [];
        const color = block.metadata?.containerBgColor || '#f9fafb';
        const opacity = Math.min(1, Math.max(0, Number(block.metadata?.containerOpacity ?? 0.1)));
        // Container mit absolutem Hintergrund-Element, damit Inhalte darüber liegen
        return `<div class="container" style="position:relative;background:transparent;opacity:1;"><div style="position:absolute;inset:0;background:${color};opacity:${opacity};"></div><div style="position:relative;z-index:10;">${blocks.map(renderBlockHtml).join('')}</div></div>`;
      }
      case 'page-break':
        return '<div class="page-break"></div>';
      case 'chapter-divider':
        return `<section class="chapter-divider"><div class="chapter-label">Chapter ${block.metadata?.chapterNumber || ''}</div><h2>${content || escapeHtml(block.metadata?.chapterTitle || '')}</h2></section>`;
      case 'cover-page': {
        const variant = block.metadata?.coverPageVariant || 'standard';
        const title = escapeHtml(content);
        const subtitle = escapeHtml(block.metadata?.coverPageSubtitle || '');
        const version = escapeHtml(block.metadata?.coverPageVersion || '');
        const confidentiality = escapeHtml(block.metadata?.coverPageConfidentiality || '');
        const today = new Date();
        const dateStr = `${today.getDate()}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
        
        // Beide Varianten zeigen jetzt Meta-Informationen
        const metaSection = `<div class="cover-meta"><p><strong>Version</strong> ${version}</p><p><strong>Datum</strong> ${dateStr}</p>${confidentiality ? `<p class="confidential"><strong>Vertraulichkeit</strong> ${confidentiality}</p>` : ''}</div>`;
        
        if (variant === 'minimal') {
          return `<section class="cover-page cover-page-minimal"><div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}${version || confidentiality ? metaSection : ''}</div></section>`;
        }
        
        return `<section class="cover-page cover-page-standard"><div><h1>${title}</h1><p>${subtitle}</p>${metaSection}</div></section>`;
      }
      case 'toc':
        return '<section><h2>Inhaltsverzeichnis</h2><p>Wird beim finalen Export automatisch erzeugt.</p></section>';
      default:
        return '';
    }
  };

  const generateReportHtmlDocument = (report: Report): string => {
    // Trennung zwischen Cover und Chapters
    const isCoverChapter = report.chapters.length > 0 && report.chapters[0].blocks.some(b => b.type === 'cover-page');
    const coverChapter = isCoverChapter ? report.chapters[0] : null;
    const contentChapters = isCoverChapter ? report.chapters.slice(1) : report.chapters;

    // Generiere TOC Links (nur für Nicht-Cover Chapters)
    const tocLinks = contentChapters
      .map((chapter, idx) => `<li><a href="#chapter-${idx + 1}" class="toc-link" data-chapter="${idx + 1}">${escapeHtml(chapter.title)}</a></li>`)
      .join('');

    // Rendere Cover Chapter separat
    const coverHtml = coverChapter ? `
      <section class="chapter-cover" id="cover">
        <div class="cover-content">
          ${coverChapter.blocks.map(block => {
            if (block.type === 'cover-page') {
              const coverTitle = escapeHtml(block.metadata?.coverPageTitle || block.metadata?.title || report.title || '');
              const coverSubtitle = escapeHtml(block.metadata?.coverPageSubtitle || block.metadata?.subtitle || '');
              const coverVersion = escapeHtml(block.metadata?.coverPageVersion || block.metadata?.version || '');
              const coverConfidentiality = escapeHtml(block.metadata?.coverPageConfidentiality || block.metadata?.confidential || '');
              const coverAuthor = escapeHtml(block.metadata?.coverPageAuthor || block.metadata?.author || report.settings.author || '');
              
              return `
                <div class="cover-page-wrapper">
                  <div class="cover-main">
                    <h1>${coverTitle}</h1>
                    ${coverSubtitle ? `<p class="cover-subtitle">${coverSubtitle}</p>` : ''}
                  </div>
                  ${(coverAuthor || coverVersion || coverConfidentiality) ? `
                    <div class="cover-meta-section">
                      ${coverAuthor ? `<p class="cover-meta-item"><strong>Author:</strong> ${coverAuthor}</p>` : ''}
                      ${coverVersion ? `<p class="cover-meta-item"><strong>Version:</strong> ${coverVersion}</p>` : ''}
                      ${coverConfidentiality ? `<p class="cover-meta-item confidential"><strong>Classification:</strong> ${coverConfidentiality}</p>` : ''}
                    </div>
                  ` : ''}
                </div>
              `;
            }
            return renderBlockHtml(block);
          }).join('')}
        </div>
      </section>
    ` : '';

    // Generiere Chapter HTML mit korrekter Nummerierung
    const chapterHtml = contentChapters
      .map((chapter, chapterIndex) => `
        <section class="chapter" data-index="${chapterIndex + 1}" id="chapter-${chapterIndex + 1}">
          <header class="chapter-header">
            <div class="chapter-kicker">Chapter ${chapterIndex + 1}</div>
            <h2>${escapeHtml(chapter.title)}</h2>
          </header>
          <div class="chapter-content">
            ${chapter.blocks.map(renderBlockHtml).join('')}
          </div>
        </section>
      `)
      .join('');

    // Maritime Color Palette
    const colors = {
      textPrimary: '#2F3E46',
      textSecondary: '#6b7280',
      accent: '#0A9396',
      accentOrange: '#EE7B00',
      bgPrimary: '#F3F6F6',
      bgSecondary: '#ffffff',
      border: '#A6B2B9',
      sidebarBg: '#002B36',
      sidebarText: '#F3F6F6',
    };

    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --text-primary: ${colors.textPrimary};
      --text-secondary: ${colors.textSecondary};
      --accent: ${colors.accent};
      --accent-orange: ${colors.accentOrange};
      --bg-primary: ${colors.bgPrimary};
      --bg-secondary: ${colors.bgSecondary};
      --border: ${colors.border};
      --sidebar-bg: ${colors.sidebarBg};
      --sidebar-text: ${colors.sidebarText};
    }

    html, body {
      width: 100%;
      height: 100%;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
      color: var(--text-primary);
      background: var(--bg-primary);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .container-layout {
      display: flex;
      flex-direction: row;
      min-height: 100vh;
    }

    /* SIDEBAR */
    .sidebar {
      background: var(--sidebar-bg);
      color: var(--sidebar-text);
      padding: 40px 28px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      border-right: 1px solid var(--border);
      width: 280px;
      flex-shrink: 0;
      order: 1;
    }

    .sidebar::-webkit-scrollbar {
      width: 8px;
    }

    .sidebar::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
    }

    .sidebar-logo {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 2px;
      color: ${colors.accent};
      letter-spacing: -0.5px;
    }

    .sidebar-tagline {
      font-size: 12px;
      color: rgba(241, 245, 249, 0.6);
      margin-bottom: 32px;
      font-weight: 400;
      line-height: 1.4;
    }

    .sidebar-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(241, 245, 249, 0.5);
      margin-bottom: 18px;
    }

    .toc {
      list-style: none;
    }

    .toc li {
      margin-bottom: 6px;
    }

    .toc a {
      display: block;
      padding: 10px 12px;
      border-radius: 6px;
      text-decoration: none;
      color: rgba(241, 245, 249, 0.75);
      font-size: 14px;
      font-weight: 500;
      transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
      border-left: 3px solid transparent;
      line-height: 1.4;
    }

    .toc a:hover {
      background: rgba(10, 147, 150, 0.15);
      color: var(--accent);
    }

    .toc a.active {
      background: rgba(10, 147, 150, 0.2);
      color: var(--sidebar-text);
      border-left-color: var(--accent);
      font-weight: 600;
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
    }

    .sidebar-footer-text {
      font-size: 11px;
      color: rgba(241, 245, 249, 0.5);
      line-height: 1.4;
      margin: 0;
    }

    /* MAIN CONTENT */
    main {
      width: 100%;
      max-width: 720px;
      margin: 0 auto;
      padding: 60px 56px;
      line-height: 1.8;
      flex: 1;
      order: 2;
    }

    /* TYPOGRAPHY */
    h1, h2, h3, h4, h5, h6 {
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: -0.3px;
      color: var(--text-primary);
      margin-bottom: 0;
    }

    h1 {
      font-size: 40px;
      margin-top: 0;
      margin-bottom: 12px;
    }

    h2 {
      font-size: 30px;
      margin-top: 52px;
      margin-bottom: 20px;
    }

    h3 {
      font-size: 22px;
      margin-top: 36px;
      margin-bottom: 14px;
      font-weight: 600;
    }

    h4 {
      font-size: 17px;
      margin-top: 28px;
      margin-bottom: 10px;
      font-weight: 600;
    }

    p {
      margin-bottom: 18px;
      color: var(--text-primary);
      line-height: 1.8;
    }

    a {
      color: var(--accent);
      text-decoration: none;
      transition: opacity 0.2s;
    }

    a:hover {
      opacity: 0.8;
      text-decoration: underline;
    }

    /* REPORT HEADER */
    .report-header {
      margin-bottom: 40px;
      padding-bottom: 0;
    }

    .report-header h1 {
      margin-top: 0;
    }

    .report-meta {
      font-size: 14px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* CHAPTERS */
    .chapter {
      margin: 64px 0;
      padding-top: 0;
    }

    .chapter:first-of-type {
      margin-top: 0;
      padding-top: 0;
    }

    .chapter-header {
      margin-bottom: 32px;
      scroll-margin-top: 100px;
    }

    .chapter-kicker {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      margin-bottom: 8px;
      opacity: 0.9;
    }

    /* LISTS */
    ul, ol {
      margin: 20px 0;
      padding-left: 28px;
      line-height: 1.8;
    }

    ul li, ol li {
      margin-bottom: 10px;
    }

    /* QUOTES & HIGHLIGHTS */
    blockquote {
      margin: 28px 0;
      padding: 0 0 0 24px;
      border-left: 3px solid var(--accent);
      font-style: italic;
      color: var(--text-secondary);
      line-height: 1.8;
    }

    .highlight {
      display: flex;
      gap: 14px;
      padding: 18px 20px;
      border-left: 3px solid var(--accent);
      border-radius: 6px;
      margin: 28px 0;
      background: rgba(10, 147, 150, 0.08);
      font-size: 15px;
    }

    .highlight span.icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    /* IMAGES & FIGURES */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      display: block;
      margin: 32px 0;
      line-height: 0;
    }

    figure {
      margin: 32px 0;
    }

    figcaption {
      margin-top: 12px;
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    /* GALLERY */
    .gallery {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin: 32px 0;
    }

    .gallery img {
      margin: 0;
      width: 100%;
      height: auto;
    }

    /* METRICS */
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin: 32px 0;
    }

    .metric {
      padding: 18px 14px;
      text-align: center;
      background: var(--bg-secondary);
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .metric-value {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .metric-label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 6px;
      line-height: 1.4;
    }

    /* COLUMNS */
    .columns {
      display: grid;
      gap: 16px;
      margin: 32px 0;
    }

    .columns-2 {
      grid-template-columns: repeat(2, 1fr);
    }

    .columns-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    .columns-4 {
      grid-template-columns: repeat(4, 1fr);
    }

    .column {
      padding: 18px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    /* CONTAINERS */
    .container {
      padding: 20px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin: 32px 0;
      position: relative;
      z-index: 1;
    }

    .container h3, .container h4 {
      margin-top: 0;
    }

    /* TABLES */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 32px 0;
      font-size: 14px;
    }

    th, td {
      padding: 12px 14px;
      text-align: left;
      border: 1px solid var(--border);
    }

    th {
      background: var(--bg-secondary);
      font-weight: 600;
      color: var(--text-primary);
    }

    td {
      line-height: 1.6;
    }

    /* TIMELINE */
    .timeline {
      display: grid;
      gap: 16px;
      margin: 32px 0;
    }

    .timeline-item {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 18px;
    }

    .timeline-date {
      font-weight: 600;
      color: var(--accent);
      font-size: 13px;
      line-height: 1.6;
    }

    .timeline-title {
      font-weight: 600;
    }

    /* CHAPTER NAVIGATION */
    .chapter-nav {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-top: 64px;
      padding-top: 48px;
      border-top: 1px solid var(--border);
    }

    .chapter-nav a {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 20px;
      border-radius: 8px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      text-decoration: none;
      color: var(--accent);
      font-size: 14px;
      font-weight: 500;
      transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .chapter-nav a:hover {
      background: rgba(10, 147, 150, 0.1);
      border-color: var(--accent);
    }

    .chapter-nav-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .chapter-nav-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .chapter-nav-prev {
      justify-self: start;
    }

    .chapter-nav-next {
      justify-self: end;
      text-align: right;
      flex-direction: row-reverse;
    }

    /* FOOTER */
    .report-footer {
      margin-top: 100px;
      padding: 48px 0;
      text-align: center;
      color: var(--text-secondary);
      font-size: 13px;
      border-top: 1px solid var(--border);
    }

    .report-footer-logo {
      font-weight: 700;
      color: var(--accent);
      font-size: 16px;
      margin-bottom: 12px;
    }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .container-layout {
        flex-direction: column;
      }

      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 280px;
        z-index: 1000;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }

      .sidebar.active {
        transform: translateX(0);
      }

      .menu-toggle {
        display: block;
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 999;
        background: var(--bg-primary);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 20px;
        cursor: pointer;
      }

      main {
        padding: 80px 28px 48px;
      }
    }

    @media (max-width: 480px) {
      main {
        padding: 80px 16px 32px;
        max-width: 100%;
      }

      h1 {
        font-size: 28px;
      }

      h2 {
        font-size: 24px;
        margin-top: 36px;
      }

      h3 {
        font-size: 18px;
        margin-top: 24px;
      }

      .metrics {
        grid-template-columns: repeat(2, 1fr);
      }

      .gallery {
        grid-template-columns: repeat(2, 1fr);
      }

      .columns-2, .columns-3, .columns-4 {
        grid-template-columns: 1fr !important;
      }

      .chapter-nav {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .chapter-nav-next {
        justify-self: auto;
      }

      table {
        font-size: 12px;
      }

      th, td {
        padding: 8px;
      }
    }

    /* COVER PAGE */
    .chapter-cover {
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }

    .cover-content {
      width: 100%;
      max-width: 720px;
      padding: 60px 56px;
      text-align: center;
    }

    .cover-page-wrapper {
      display: flex;
      flex-direction: column;
      gap: 60px;
    }

    .cover-main {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .cover-main h1 {
      font-size: 48px;
      font-weight: 900;
      margin: 0;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }

    .cover-subtitle {
      font-size: 20px;
      color: var(--text-secondary);
      font-weight: 300;
      margin: 0;
    }

    .cover-meta-section {
      border-top: 1px solid var(--border);
      padding-top: 40px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .cover-meta-item {
      font-size: 14px;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.6;
    }

    .cover-meta-item strong {
      color: var(--accent);
      display: block;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .cover-meta-item.confidential {
      color: var(--accent-orange);
    }

    .cover-meta-item.confidential strong {
      color: var(--accent-orange);
    }
  </style>
</head>
<body>
  <div class="container-layout">
    <button class="menu-toggle">☰</button>
    <aside class="sidebar">
      <div class="sidebar-logo">${escapeHtml(report.settings.sidebarBrandLine1 || 're:think yachting')}</div>
      <div class="sidebar-tagline">${escapeHtml(report.settings.sidebarBrandLine2 || 'report & dossier studio')}</div>
      <div class="sidebar-title">Inhalt</div>
      <nav>
        <ul class="toc">
          ${tocLinks}
        </ul>
      </nav>
      ${report.settings.sidebarFooterText ? `
        <div class="sidebar-footer">
          <p class="sidebar-footer-text">${escapeHtml(report.settings.sidebarFooterText)}</p>
        </div>
      ` : ''}
    </aside>

    <main>
      ${coverHtml ? `
        ${coverHtml}
      ` : `
        <header class="report-header">
          <h1>${escapeHtml(report.title)}</h1>
          <div class="report-meta">${escapeHtml(report.description || '')}${report.settings.author ? ` • ${escapeHtml(report.settings.author)}` : ''}</div>
        </header>
      `}

      ${chapterHtml}

      <footer class="report-footer">
        <div class="report-footer-logo">${escapeHtml(report.settings.reportFooterText || 'Mastery re:engineered.')}</div>
        <p>${escapeHtml(report.title)}</p>
      </footer>
    </main>
  </div>

  <script>
    // Mobile menu
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const tocLinks = document.querySelectorAll('.toc-link');

    if (menuToggle) {
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('active');
      });

      tocLinks.forEach(link => {
        link.addEventListener('click', () => {
          sidebar.classList.remove('active');
        });
      });

      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
          sidebar.classList.remove('active');
        }
      });
    }

    // Navigation tracking
    const chapters = document.querySelectorAll('[data-index]');
    const totalChapters = chapters.length;

    function updateActiveLink() {
      const scrollPos = window.scrollY + 100;
      let activeChapter = 1;

      chapters.forEach(chapter => {
        if (chapter.offsetTop <= scrollPos) {
          activeChapter = parseInt(chapter.getAttribute('data-index'));
        }
      });

      tocLinks.forEach(link => {
        link.classList.remove('active');
      });

      const activeLink = document.querySelector(\`.toc-link[data-chapter="\${activeChapter}"]\`);
      if (activeLink) activeLink.classList.add('active');

      updateNavigation(activeChapter);
    }

    function updateNavigation(current) {
      const titles = ${JSON.stringify(contentChapters.map(c => c.title))};

      let navHtml = '';

      if (current > 1) {
        navHtml += \`<a href="#chapter-\${current-1}" class="chapter-nav-prev">
          <div>
            <div class="chapter-nav-label">← Zurück</div>
            <div class="chapter-nav-title">\${titles[current-2]}</div>
          </div>
        </a>\`;
      }

      if (current < totalChapters) {
        navHtml += \`<a href="#chapter-\${current+1}" class="chapter-nav-next">
          <div>
            <div class="chapter-nav-label">Weiter →</div>
            <div class="chapter-nav-title">\${titles[current]}</div>
          </div>
        </a>\`;
      }

      const oldNav = document.querySelector('.chapter-nav');
      if (oldNav) oldNav.remove();

      const lastSection = document.querySelector('section[data-index="' + current + '"]');
      if (lastSection && navHtml) {
        const navDiv = document.createElement('div');
        navDiv.className = 'chapter-nav';
        navDiv.innerHTML = navHtml;
        lastSection.appendChild(navDiv);
      }
    }

    // Smooth scrolling
    document.querySelectorAll('a[href^="#chapter-"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    window.addEventListener('scroll', updateActiveLink);
    window.addEventListener('load', updateActiveLink);
    updateActiveLink();
  </script>
</body>
</html>`;
  };

  const handleExportHtml = async () => {
    if (!activeReport || isExportingHtml) return;
    try {
      setIsExportingHtml(true);
      const html = generateReportHtmlDocument(activeReport);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const fileName = `${toSafeFileName(activeReport.title)}.html`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsExportingHtml(false);
    }
  };

  const handleExportPdf = async () => {
    if (!activeReport || isExportingPdf) return;

    try {
      setIsExportingPdf(true);

      const orientation = activeReport.settings.orientation;
      const format = activeReport.settings.paperFormat.toLowerCase() as 'a3' | 'a4' | 'letter';
      const pdf = new jsPDF({ orientation, unit: 'mm', format });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginTop = activeReport.settings.marginTop;
      const marginBottom = activeReport.settings.marginBottom;
      const marginLeft = activeReport.settings.marginLeft;
      const marginRight = activeReport.settings.marginRight;
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Erweiterte CSS für PDF
      const pdfCss = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ${activeReport.settings.fontFamily}; color: ${activeReport.settings.textColor}; line-height: 1.6; font-size: 11pt; }
        h1 { font-family: ${activeReport.settings.headingFontFamily}; font-size: 28pt; font-weight: 900; margin: 20pt 0 12pt 0; color: #1f2937; letter-spacing: -0.02em; }
        h2 { font-family: ${activeReport.settings.headingFontFamily}; font-size: 22pt; font-weight: 700; margin: 16pt 0 10pt 0; color: #1f2937; page-break-after: avoid; }
        h3 { font-family: ${activeReport.settings.headingFontFamily}; font-size: 16pt; font-weight: 600; margin: 12pt 0 8pt 0; color: #374151; page-break-after: avoid; }
        p { margin: 0 0 10pt 0; }
        ul { list-style: disc; margin: 10pt 0 10pt 24pt; padding-left: 0; }
        ol { list-style: decimal; margin: 10pt 0 10pt 24pt; padding-left: 0; }
        li { margin-bottom: 6pt; margin-left: 0; }
        figure { margin: 12pt 0; page-break-inside: avoid; }
        img { max-width: 100%; height: auto; display: block; }
        figcaption { font-size: 9pt; color: #6b7280; margin-top: 4pt; font-style: italic; }
        table { width: 100%; border-collapse: collapse; margin: 10pt 0; page-break-inside: avoid; }
        th, td { border: 0.5pt solid #d1d5db; padding: 6pt 8pt; text-align: left; }
        th { background: #f3f4f6; font-weight: 600; }
        blockquote { border-left: 3pt solid #3b82f6; padding-left: 12pt; margin: 12pt 0; color: #4b5563; font-style: italic; page-break-inside: avoid; }
        .highlight { border-left: 3pt solid #f59e0b; background: #fef3c7; padding: 10pt 12pt; margin: 10pt 0; border-radius: 4pt; page-break-inside: avoid; }
        .icon { margin-right: 8pt; font-size: 14pt; }
        .gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10pt; margin: 10pt 0; }
        .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8pt; margin: 10pt 0; page-break-inside: avoid; }
        .metric { background: #f0f9ff; padding: 10pt; border-radius: 4pt; text-align: center; }
        .metric-value { font-size: 16pt; font-weight: 700; color: #0369a1; }
        .metric-label { font-size: 9pt; color: #6b7280; margin-top: 4pt; }
        .timeline { margin: 10pt 0; page-break-inside: avoid; }
        .timeline-item { margin-bottom: 12pt; display: flex; gap: 12pt; page-break-inside: avoid; }
        .timeline-date { font-weight: 600; min-width: 40pt; color: #0369a1; }
        .timeline-title { font-weight: 600; margin-bottom: 4pt; }
        .cta { border: 1pt solid #d1d5db; border-radius: 6pt; padding: 16pt; margin: 12pt 0; background: #f9fafb; page-break-inside: avoid; text-align: center; }
        .columns { display: grid; gap: 12pt; margin: 12pt 0; }
        .columns-2 { grid-template-columns: repeat(2, 1fr); }
        .columns-3 { grid-template-columns: repeat(3, 1fr); }
        .column { background: #f9fafb; padding: 10pt; border: 0.5pt solid #e5e7eb; border-radius: 4pt; page-break-inside: avoid; }
        .container { padding: 10pt; border: 0.5pt solid #e5e7eb; border-radius: 4pt; margin: 10pt 0; page-break-inside: avoid; }
        .faq { margin: 10pt 0; page-break-inside: avoid; }
        .faq details { margin-bottom: 8pt; padding: 6pt; border: 0.5pt solid #e5e7eb; border-radius: 4pt; }
        .divider { height: 0.5pt; background: #d1d5db; margin: 12pt 0; }
        .spacer { margin: 0; }
        .button { display: inline-block; padding: 8pt 16pt; background: #1f2937; color: white; text-decoration: none; border-radius: 4pt; font-weight: 600; font-size: 11pt; }
        .cover-page { width: 100%; height: 297mm; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; text-align: center; padding: 60pt 40pt; page-break-after: always; break-after: page; }
        .cover-page h1 { color: white; font-size: 48pt; margin-bottom: 20pt; }
        .cover-page-standard p { font-size: 20pt; font-weight: 300; color: #d1d5db; margin-bottom: 30pt; }
        .cover-meta { border-top: 1pt solid #374151; padding-top: 30pt; margin-top: 30pt; }
        .cover-meta p { font-size: 11pt; color: #9ca3af; margin: 8pt 0; }
        .confidential { color: #fca5a5; font-weight: 600; }
        .chapter-divider { padding: 20pt 0; margin: 20pt 0; border-bottom: 1pt solid #d1d5db; page-break-after: avoid; }
        .chapter-label { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 600; margin-bottom: 6pt; }
      `;

      // Container für temporäres Rendering erstellen
      const tempRoot = document.createElement('div');
      tempRoot.style.position = 'absolute';
      tempRoot.style.left = '0';
      tempRoot.style.top = '-9999px'; // Außerhalb des Viewports aber im Layout
      tempRoot.style.width = `${contentWidth}mm`;
      tempRoot.style.background = '#ffffff';
      tempRoot.style.overflow = 'visible';
      tempRoot.style.minHeight = '10px';
      const styleEl = document.createElement('style');
      styleEl.innerHTML = pdfCss;
      document.head.appendChild(styleEl);
      document.body.appendChild(tempRoot);

      let currentY = marginTop;

      // Hilfsfunktion: Konvertiere Bild zu Data URL
      // Hilfsfunktion: Rendere einen Block und konvertiere zu Bild
      const renderAndAddBlock = async (htmlContent: string, forceNewPage = false, preventSplit = false) => {
        if (forceNewPage && currentY > marginTop) {
          pdf.addPage();
          currentY = marginTop;
        }

        tempRoot.innerHTML = htmlContent;
        
        // Warte auf Layout
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          const canvas = await html2canvas(tempRoot, {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 0,
            ignoreMissingNamespace: true,
          });

          if (canvas.width === 0 || canvas.height === 0) {
            console.warn('Canvas empty, skipping');
            return;
          }

          const imgData = canvas.toDataURL('image/png');
          const sectionHeightMm = (canvas.height / canvas.width) * contentWidth;
          const pageContentHeightMm = pageHeight - marginTop - marginBottom;
          const availableHeight = pageHeight - marginBottom - currentY;

          // Für komplexe Layouts: versuche auf eine Seite zu bekommen
          if (preventSplit && sectionHeightMm > availableHeight - 2) {
            pdf.addPage();
            currentY = marginTop;
          }

          // Wenn auf aktuelle Seite passt
          if (sectionHeightMm <= pageHeight - marginTop - marginBottom - 2) {
            if (currentY + sectionHeightMm > pageHeight - marginBottom) {
              pdf.addPage();
              currentY = marginTop;
            }
            pdf.addImage(imgData, 'PNG', marginLeft, currentY, contentWidth, sectionHeightMm);
            currentY += sectionHeightMm + 1;
          } else {
            // Zu groß - teile auf
            const pxPerMm = canvas.width / contentWidth;
            const maxHeightPerPagePx = Math.floor((pageHeight - marginTop - marginBottom) * pxPerMm) - 15;
            
            let offsetPx = 0;
            let isFirst = true;

            while (offsetPx < canvas.height) {
              const sliceHeightPx = Math.min(maxHeightPerPagePx, canvas.height - offsetPx);
              const sliceCanvas = document.createElement('canvas');
              sliceCanvas.width = canvas.width;
              sliceCanvas.height = sliceHeightPx;
              
              const ctx = sliceCanvas.getContext('2d');
              if (!ctx) break;

              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, sliceHeightPx);
              ctx.drawImage(canvas, 0, offsetPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

              const sliceData = sliceCanvas.toDataURL('image/png');
              const sliceHeightMm = sliceHeightPx / pxPerMm;

              if (!isFirst || currentY + sliceHeightMm > pageHeight - marginBottom) {
                pdf.addPage();
                currentY = marginTop;
              }

              pdf.addImage(sliceData, 'PNG', marginLeft, currentY, contentWidth, sliceHeightMm);
              currentY += sliceHeightMm;
              isFirst = false;

              sliceCanvas.width = 0;
              sliceCanvas.height = 0;
              offsetPx += sliceHeightPx;
            }
          }
        } catch (err) {
          console.error('Render error:', err);
        }
      };

      // Process chapters
      let chapterNumberOffset = 0;
      let coverPageFound = false;

      for (let chapterIndex = 0; chapterIndex < activeReport.chapters.length; chapterIndex++) {
        const chapter = activeReport.chapters[chapterIndex];
        let accumulatedHtml = '';
        let hasCoverPage = false;

        // Prüfe ob dieser Chapter einen Cover-Page-Block hat
        for (const block of chapter.blocks) {
          if (block.type === 'cover-page') {
            hasCoverPage = true;
            coverPageFound = true;
            break;
          }
        }

        for (const block of chapter.blocks) {
          if (block.type === 'cover-page') {
            // Rendere angesammelte Blöcke zuerst
            if (accumulatedHtml) {
              await renderAndAddBlock(`<div style="padding: 0;">${accumulatedHtml}</div>`);
              accumulatedHtml = '';
            }
            // Rendere Cover auf neuer Seite
            await renderAndAddBlock(renderBlockHtml(block), true, true);
            // Nach Cover wird die Nummerierung bei 1 zurückgesetzt
            chapterNumberOffset = chapterIndex + 1;
          } else if (block.type === 'page-break') {
            // Rendere angesammelte Blöcke
            if (accumulatedHtml) {
              await renderAndAddBlock(`<div style="padding: 0;">${accumulatedHtml}</div>`);
              accumulatedHtml = '';
            }
            pdf.addPage();
            currentY = marginTop;
          } else if (block.type === 'columns' || block.type === 'gallery' || block.type === 'metrics' || block.type === 'table') {
            // Rendere komplexe Layouts einzeln ohne Splitting
            if (accumulatedHtml) {
              await renderAndAddBlock(`<div style="padding: 0;">${accumulatedHtml}</div>`);
              accumulatedHtml = '';
            }
            await renderAndAddBlock(renderBlockHtml(block), false, true);
          } else {
            accumulatedHtml += renderBlockHtml(block);
          }
        }

        // Rendere verbleibende Blöcke
        if (accumulatedHtml) {
          // Chapter Header nur wenn kein Cover-Page vorhanden ist
          if (hasCoverPage) {
            // Kein Header für Kapitel mit Cover-Page
            await renderAndAddBlock(`<div style="padding: 0;">${accumulatedHtml}</div>`);
          } else {
            // Normaler Chapter mit Header
            // Nummerierung startet bei 1 nach einem Cover-Page
            const displayChapterNumber = coverPageFound ? chapterIndex - chapterNumberOffset + 1 : chapterIndex + 1;
            const chapterHeader = `
              <div class="chapter-divider">
                <div class="chapter-label">Chapter ${displayChapterNumber}</div>
                <h2>${escapeHtml(chapter.title)}</h2>
              </div>
              ${accumulatedHtml}
            `;
            await renderAndAddBlock(chapterHeader, chapterIndex > 0);
          }
        }
      }

      // Cleanup
      document.body.removeChild(tempRoot);
      document.head.removeChild(styleEl);

      // Seitennummerierung
      if (activeReport.settings.pageNumbering) {
        const totalPages = pdf.getNumberOfPages();
        for (let page = 1; page <= totalPages; page++) {
          pdf.setPage(page);
          pdf.setFontSize(9);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`${page} / ${totalPages}`, pageWidth - marginRight - 5, pageHeight - marginBottom / 2 + 2, { align: 'right' });
        }
      }

      pdf.save(`${toSafeFileName(activeReport.title)}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      window.alert(error instanceof Error ? error.message : 'PDF export failed.');
    } finally {
      setIsExportingPdf(false);
    }
  };

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
                  {report.chapters.length} Chapters
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
                  {activeReport.settings.reportType === 'bericht' ? 'Report' : 'Dossier'} • {activeReport.chapters.length} Chapters
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {isExportingPdf ? 'Exportiere…' : 'PDF'}
                </button>
                <button
                  onClick={handleExportHtml}
                  disabled={isExportingHtml}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Code size={16} />
                  {isExportingHtml ? 'Exportiere…' : 'HTML'}
                </button>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium flex items-center gap-2"
                  title="Einstellungen"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {/* ===== EDITOR AREA ===== */}
            <div className="flex-1 flex overflow-hidden">
              {/* CHAPTERS PANEL */}
              <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Chapters</h3>
                  <button
                    onClick={handleAddChapter}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Add Chapter"
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
                        Chapter
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
                        onImageUpload={(blockId, file) => handleImageUpload(activeChapter.id, blockId, file)}
                        uploadingBlockId={uploadingBlockId}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No Chapter selected</p>
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

      {/* ===== SETTINGS MODAL ===== */}
      {showSettings && activeReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Einstellungen</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 px-6">
              <div className="flex gap-4">
                {[
                  { id: 'general' as const, label: 'Allgemein' },
                  { id: 'layout' as const, label: 'Seiten-Layout' },
                  { id: 'design' as const, label: 'Design' },
                  { id: 'branding' as const, label: 'Branding' },
                  { id: 'storage' as const, label: 'Speicher' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsTab(tab.id)}
                    className={`py-3 px-1 border-b-2 text-sm font-medium transition ${
                      settingsTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* GENERAL TAB */}
              {settingsTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                    <input
                      type="text"
                      value={activeReport.title}
                      onChange={(e) => updateReportMetadata({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                    <textarea
                      value={activeReport.description || ''}
                      onChange={(e) => updateReportMetadata({ description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
                    <input
                      type="text"
                      value={activeReport.settings.author || ''}
                      onChange={(e) => updateReportSettings({ author: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report-Typ</label>
                    <select
                      value={activeReport.settings.reportType}
                      onChange={(e) => updateReportSettings({ reportType: e.target.value as ReportType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="bericht">Bericht</option>
                      <option value="dossier">Dossier</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tocEnabled"
                      checked={activeReport.settings.tocEnabled}
                      onChange={(e) => updateReportSettings({ tocEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="tocEnabled" className="text-sm text-gray-700">Inhaltsverzeichnis aktivieren</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="headerFooterEnabled"
                      checked={activeReport.settings.headerFooterEnabled}
                      onChange={(e) => updateReportSettings({ headerFooterEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="headerFooterEnabled" className="text-sm text-gray-700">Kopf-/Fußzeile aktivieren</label>
                  </div>
                </div>
              )}

              {/* LAYOUT TAB */}
              {settingsTab === 'layout' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Papierformat</label>
                      <select
                        value={activeReport.settings.paperFormat}
                        onChange={(e) => updateReportSettings({ paperFormat: e.target.value as 'A3' | 'A4' | 'Letter' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="A4">A4</option>
                        <option value="A3">A3</option>
                        <option value="Letter">Letter</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ausrichtung</label>
                      <select
                        value={activeReport.settings.orientation}
                        onChange={(e) => updateReportSettings({ orientation: e.target.value as 'portrait' | 'landscape' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="portrait">Hochformat</option>
                        <option value="landscape">Querformat</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Seitenränder (mm)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Oben</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={activeReport.settings.marginTop}
                          onChange={(e) => updateReportSettings({ marginTop: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Unten</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={activeReport.settings.marginBottom}
                          onChange={(e) => updateReportSettings({ marginBottom: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Links</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={activeReport.settings.marginLeft}
                          onChange={(e) => updateReportSettings({ marginLeft: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Rechts</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={activeReport.settings.marginRight}
                          onChange={(e) => updateReportSettings({ marginRight: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="pageNumbering"
                      checked={activeReport.settings.pageNumbering}
                      onChange={(e) => updateReportSettings({ pageNumbering: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="pageNumbering" className="text-sm text-gray-700">Seitennummerierung anzeigen</label>
                  </div>
                </div>
              )}

              {/* DESIGN TAB */}
              {settingsTab === 'design' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schriftart (Fließtext)</label>
                    <input
                      type="text"
                      value={activeReport.settings.fontFamily}
                      onChange={(e) => updateReportSettings({ fontFamily: e.target.value })}
                      placeholder="'Inter', sans-serif"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schriftart (Überschriften)</label>
                    <input
                      type="text"
                      value={activeReport.settings.headingFontFamily}
                      onChange={(e) => updateReportSettings({ headingFontFamily: e.target.value })}
                      placeholder="'Inter', sans-serif"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Basis-Schriftgröße</label>
                    <input
                      type="number"
                      min="12"
                      max="24"
                      value={activeReport.settings.baseFontSize}
                      onChange={(e) => updateReportSettings({ baseFontSize: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Farben</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-700 w-32">Akzentfarbe</label>
                        <input
                          type="color"
                          value={activeReport.settings.accentColor}
                          onChange={(e) => updateReportSettings({ accentColor: e.target.value })}
                          className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={activeReport.settings.accentColor}
                          onChange={(e) => updateReportSettings({ accentColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-700 w-32">Textfarbe</label>
                        <input
                          type="color"
                          value={activeReport.settings.textColor}
                          onChange={(e) => updateReportSettings({ textColor: e.target.value })}
                          className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={activeReport.settings.textColor}
                          onChange={(e) => updateReportSettings({ textColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-700 w-32">Hintergrundfarbe</label>
                        <input
                          type="color"
                          value={activeReport.settings.backgroundColor}
                          onChange={(e) => updateReportSettings({ backgroundColor: e.target.value })}
                          className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={activeReport.settings.backgroundColor}
                          onChange={(e) => updateReportSettings({ backgroundColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BRANDING TAB */}
              {settingsTab === 'branding' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sidebar - Erste Zeile (Logo)</label>
                    <input
                      type="text"
                      value={activeReport.settings.sidebarBrandLine1 || ''}
                      onChange={(e) => updateReportSettings({ sidebarBrandLine1: e.target.value })}
                      placeholder="re:think yachting"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">z.B. "re:think yachting"</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sidebar - Zweite Zeile (Tagline)</label>
                    <input
                      type="text"
                      value={activeReport.settings.sidebarBrandLine2 || ''}
                      onChange={(e) => updateReportSettings({ sidebarBrandLine2: e.target.value })}
                      placeholder="report & dossier studio"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">z.B. "report & dossier studio"</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sidebar - Footer (Unten)</label>
                    <input
                      type="text"
                      value={activeReport.settings.sidebarFooterText || ''}
                      onChange={(e) => updateReportSettings({ sidebarFooterText: e.target.value })}
                      placeholder="re:think yachting UG - Hamburg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">z.B. "re:think yachting UG - Hamburg"</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Footer - Mittig</label>
                    <input
                      type="text"
                      value={activeReport.settings.reportFooterText || ''}
                      onChange={(e) => updateReportSettings({ reportFooterText: e.target.value })}
                      placeholder="Mastery re:engineered."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">z.B. "Mastery re:engineered."</p>
                  </div>
                </div>
              )}

              {/* STORAGE TAB */}
              {settingsTab === 'storage' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Firebase Storage</strong> ermöglicht es, Bilder direkt in die Cloud hochzuladen.
                      Wenn deaktiviert, werden Bilder als Data-URLs gespeichert.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="storageEnabled"
                      checked={activeReport.settings.storageConfig.enabled}
                      onChange={(e) => updateReportSettings({ 
                        storageConfig: { ...activeReport.settings.storageConfig, enabled: e.target.checked } 
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="storageEnabled" className="text-sm font-medium text-gray-700">Firebase Storage aktivieren</label>
                  </div>

                  {activeReport.settings.storageConfig.enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
                        <input
                          type="text"
                          value={activeReport.settings.storageConfig.projectId}
                          onChange={(e) => updateReportSettings({ 
                            storageConfig: { ...activeReport.settings.storageConfig, projectId: e.target.value } 
                          })}
                          placeholder="my-firebase-project"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
                        <input
                          type="text"
                          value={activeReport.settings.storageConfig.bucketName}
                          onChange={(e) => updateReportSettings({ 
                            storageConfig: { ...activeReport.settings.storageConfig, bucketName: e.target.value } 
                          })}
                          placeholder="my-firebase-project.appspot.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                        <select
                          value={activeReport.settings.storageConfig.region}
                          onChange={(e) => updateReportSettings({ 
                            storageConfig: { ...activeReport.settings.storageConfig, region: e.target.value } 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="europe-west1">europe-west1 (Belgien)</option>
                          <option value="europe-west3">europe-west3 (Frankfurt)</option>
                          <option value="us-central1">us-central1 (Iowa)</option>
                          <option value="us-east1">us-east1 (South Carolina)</option>
                          <option value="asia-east1">asia-east1 (Taiwan)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
