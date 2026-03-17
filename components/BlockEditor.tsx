import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Copy, MoveUp, MoveDown, UploadCloud, Loader2 } from 'lucide-react';
import { Chapter, ReportBlock, ReportBlockType, FAQItem } from '../types';
import SlashMenu from './SlashMenu';

interface BlockEditorProps {
  chapter: Chapter;
  onBlocksChange: (blocks: ReportBlock[]) => void;
  onImageUpload?: (blockId: string, file: File) => Promise<void>;
  uploadingBlockId?: string | null;
}

type AddTarget =
  | { scope: 'root'; afterId: string | null }
  | { scope: 'container'; containerId: string; afterId: string | null }
  | { scope: 'column'; columnsId: string; columnIndex: number; afterId: string | null };

const BlockEditor: React.FC<BlockEditorProps> = ({
  chapter,
  onBlocksChange,
  onImageUpload,
  uploadingBlockId,
}) => {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ x: 0, y: 0 });
  const [addTarget, setAddTarget] = useState<AddTarget>({ scope: 'root', afterId: null });

  const createDefaultBlock = (type: ReportBlockType): ReportBlock => {
    const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    switch (type) {
      case 'h1':
        return { id, type, content: 'Überschrift 1' };
      case 'h2':
        return { id, type, content: 'Überschrift 2' };
      case 'h3':
        return { id, type, content: 'Überschrift 3' };
      case 'text':
        return { id, type, content: 'Gib hier deinen Text ein...' };
      case 'highlight':
        return { id, type, content: 'Wichtiger Hinweis', metadata: { highlightIcon: '💡', highlightColor: '#f59e0b', highlightOpacity: 0.12 } };
      case 'bullets':
        return { id, type, content: 'Erster Punkt\nZweiter Punkt\nDritter Punkt', metadata: { listStyle: 'bullets' } };
      case 'quote-block':
        return { id, type, content: 'Zitat oder wichtiger Text' };
      case 'citation':
        return { id, type, content: 'Zitat', metadata: { citationAuthor: 'Autor' } };
      case 'image':
        return { id, type, content: '', metadata: { src: 'https://images.unsplash.com/photo-1506765515384-028b60a970df?w=1200', caption: 'Bildunterschrift' } };
      case 'gallery':
        return {
          id,
          type,
          content: '',
          metadata: {
            images: [
              { id: 'g1', src: 'https://images.unsplash.com/photo-1506765515384-028b60a970df?w=600', caption: 'Bild 1' },
              { id: 'g2', src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600', caption: 'Bild 2' },
              { id: 'g3', src: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600', caption: 'Bild 3' },
            ],
          },
        };
      case 'columns':
        return { id, type, content: '', metadata: { columnCount: 2, columns: [[], []] } };
      case 'container':
        return { id, type, content: '', metadata: { containerBlocks: [], containerBgColor: '#f59e0b', containerOpacity: 0.1 } };
      case 'spacer':
        return { id, type, content: '', metadata: { fontSize: 40 } };
      case 'divider':
        return { id, type, content: '' };
      case 'button':
        return { id, type, content: '', metadata: { buttonText: 'Mehr erfahren', buttonLink: '#' } };
      case 'link':
        return { id, type, content: 'Link Text', metadata: { link: 'https://example.com' } };
      case 'cta':
        return { id, type, content: '', metadata: { title: 'Ready to start?', description: 'Contact us today.', buttonText: 'Get Started', buttonLink: '#', alignment: 'center' } };
      case 'table':
        return { id, type, content: '', metadata: { tableHeader: true, tableData: [['Header 1', 'Header 2', 'Header 3'], ['A', 'B', 'C'], ['D', 'E', 'F']] } };
      case 'metrics':
        return {
          id,
          type,
          content: '',
          metadata: {
            metricsData: [
              { id: 'm1', label: 'Projects', value: '24', color: '#3b82f6' },
              { id: 'm2', label: 'Growth', value: '+32%', color: '#10b981' },
              { id: 'm3', label: 'Revenue', value: '€250K', color: '#f59e0b' },
              { id: 'm4', label: 'NPS', value: '74', color: '#8b5cf6' },
            ],
          },
        };
      case 'timeline':
        return {
          id,
          type,
          content: '',
          metadata: {
            timelineItems: [
              { id: 't1', date: '2024', title: 'Projekt Start', description: 'Beginn der Entwicklung' },
              { id: 't2', date: '2025', title: 'Beta Launch', description: 'Erste öffentliche Version' },
              { id: 't3', date: '2026', title: 'Release', description: 'Offizielle Veröffentlichung' },
            ],
          },
        };
      case 'faq': {
        const faq: FAQItem[] = [
          { id: 'f1', question: 'Frage 1', answer: 'Antwort 1' },
          { id: 'f2', question: 'Frage 2', answer: 'Antwort 2' },
        ];
        return { id, type, content: '', metadata: { faqItems: faq } };
      }
      case 'video':
        return { id, type, content: '', metadata: { src: '' } };
      case 'embed':
        return { id, type, content: '', metadata: { src: '', embedWidth: 1000, embedHeight: 420 } };
      case 'database':
        return { id, type, content: '', metadata: { collectionName: 'Collection', dbView: 'grid', dbItems: [] } };
      case 'page-break':
        return { id, type, content: '', metadata: { pageBreakType: 'before' } };
      case 'chapter-divider':
        return { id, type, content: 'Chapter Title', metadata: { chapterNumber: 1 } };
      case 'cover-page':
        return { id, type, content: 'Titel', metadata: { coverPageVariant: 'standard', coverPageSubtitle: 'Untertitel', coverPageVersion: '1.0', coverPageConfidentiality: 'Confidential' } };
      case 'toc':
        return { id, type, content: '' };
      default:
        return { id, type, content: '' };
    }
  };

  const cloneDeepBlock = (block: ReportBlock): ReportBlock => {
    const cloned: ReportBlock = {
      ...block,
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      metadata: block.metadata ? { ...block.metadata } : undefined,
    };

    if (cloned.metadata?.columns) {
      cloned.metadata.columns = cloned.metadata.columns.map((column) => column.map(cloneDeepBlock));
    }

    if (cloned.metadata?.containerBlocks) {
      cloned.metadata.containerBlocks = cloned.metadata.containerBlocks.map(cloneDeepBlock);
    }

    if (cloned.metadata?.images) {
      cloned.metadata.images = cloned.metadata.images.map((image) => ({ ...image, id: `${image.id}-${Math.random().toString(36).slice(2, 6)}` }));
    }

    if (cloned.metadata?.faqItems) {
      cloned.metadata.faqItems = cloned.metadata.faqItems.map((item) => ({ ...item, id: `${item.id}-${Math.random().toString(36).slice(2, 6)}` }));
    }

    return cloned;
  };

  const findBlockById = (list: ReportBlock[], id: string): ReportBlock | null => {
    for (const block of list) {
      if (block.id === id) return block;
      if (block.metadata?.containerBlocks) {
        const inContainer = findBlockById(block.metadata.containerBlocks, id);
        if (inContainer) return inContainer;
      }
      if (block.metadata?.columns) {
        for (const column of block.metadata.columns) {
          const inColumn = findBlockById(column, id);
          if (inColumn) return inColumn;
        }
      }
    }
    return null;
  };

  const mapBlocksDeep = (list: ReportBlock[], mapFn: (block: ReportBlock) => ReportBlock): ReportBlock[] => {
    return list.map((block) => {
      let next = mapFn(block);

      if (next.metadata?.containerBlocks) {
        next = {
          ...next,
          metadata: {
            ...next.metadata,
            containerBlocks: mapBlocksDeep(next.metadata.containerBlocks, mapFn),
          },
        };
      }

      if (next.metadata?.columns) {
        next = {
          ...next,
          metadata: {
            ...next.metadata,
            columns: next.metadata.columns.map((column) => mapBlocksDeep(column, mapFn)),
          },
        };
      }

      return next;
    });
  };

  const insertAfter = (list: ReportBlock[], afterId: string | null, block: ReportBlock): ReportBlock[] => {
    if (!afterId) return [...list, block];
    const index = list.findIndex((item) => item.id === afterId);
    if (index === -1) return [...list, block];
    return [...list.slice(0, index + 1), block, ...list.slice(index + 1)];
  };

  const updateBlock = (id: string, updates: Partial<ReportBlock>) => {
    onBlocksChange(
      mapBlocksDeep(chapter.blocks, (block) => {
        if (block.id !== id) return block;
        return {
          ...block,
          ...updates,
          metadata: {
            ...block.metadata,
            ...updates.metadata,
          },
        };
      })
    );
  };

  const updateRootList = (updater: (list: ReportBlock[]) => ReportBlock[]) => {
    onBlocksChange(updater(chapter.blocks));
  };

  const updateContainerBlocks = (containerId: string, updater: (list: ReportBlock[]) => ReportBlock[]) => {
    const container = findBlockById(chapter.blocks, containerId);
    if (!container) return;
    const current = container.metadata?.containerBlocks || [];
    updateBlock(containerId, { metadata: { containerBlocks: updater(current) } });
  };

  const updateColumnBlocks = (columnsId: string, columnIndex: number, updater: (list: ReportBlock[]) => ReportBlock[]) => {
    const columnsBlock = findBlockById(chapter.blocks, columnsId);
    if (!columnsBlock) return;
    const count = columnsBlock.metadata?.columnCount || 2;
    const columns = Array.from({ length: count }, (_, idx) => columnsBlock.metadata?.columns?.[idx] || []);
    const updatedColumns = columns.map((column, idx) => (idx === columnIndex ? updater(column) : column));
    updateBlock(columnsId, { metadata: { columnCount: count, columns: updatedColumns } });
  };

  const openSlash = (target: AddTarget, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setAddTarget(target);
    setSlashMenuPos({ x: rect.left, y: rect.bottom + 4 });
    setSlashMenuOpen(true);
  };

  const addBlock = (type: ReportBlockType) => {
    const newBlock = createDefaultBlock(type);

    if (addTarget.scope === 'root') {
      updateRootList((list) => insertAfter(list, addTarget.afterId, newBlock));
    }

    if (addTarget.scope === 'container') {
      updateContainerBlocks(addTarget.containerId, (list) => insertAfter(list, addTarget.afterId, newBlock));
    }

    if (addTarget.scope === 'column') {
      updateColumnBlocks(addTarget.columnsId, addTarget.columnIndex, (list) => insertAfter(list, addTarget.afterId, newBlock));
    }

    setEditingBlockId(newBlock.id);
    setSlashMenuOpen(false);
  };

  const deleteBlock = (id: string) => {
    const removeFromList = (list: ReportBlock[]): ReportBlock[] => list
      .filter((block) => block.id !== id)
      .map((block) => {
        let next = block;
        if (next.metadata?.containerBlocks) {
          next = {
            ...next,
            metadata: {
              ...next.metadata,
              containerBlocks: removeFromList(next.metadata.containerBlocks),
            },
          };
        }
        if (next.metadata?.columns) {
          next = {
            ...next,
            metadata: {
              ...next.metadata,
              columns: next.metadata.columns.map(removeFromList),
            },
          };
        }
        return next;
      });

    onBlocksChange(removeFromList(chapter.blocks));
  };

  const duplicateBlock = (id: string) => {
    const block = findBlockById(chapter.blocks, id);
    if (!block) return;
    const duplicate = cloneDeepBlock(block);

    const duplicateInList = (list: ReportBlock[]): ReportBlock[] => {
      const index = list.findIndex((item) => item.id === id);
      if (index !== -1) {
        return [...list.slice(0, index + 1), duplicate, ...list.slice(index + 1)];
      }

      return list.map((item) => {
        if (item.metadata?.containerBlocks) {
          return {
            ...item,
            metadata: {
              ...item.metadata,
              containerBlocks: duplicateInList(item.metadata.containerBlocks),
            },
          };
        }

        if (item.metadata?.columns) {
          return {
            ...item,
            metadata: {
              ...item.metadata,
              columns: item.metadata.columns.map(duplicateInList),
            },
          };
        }

        return item;
      });
    };

    onBlocksChange(duplicateInList(chapter.blocks));
  };

  const moveBlockInList = (list: ReportBlock[], id: string, direction: 'up' | 'down'): ReportBlock[] => {
    const index = list.findIndex((block) => block.id === id);
    if (index === -1) return list;
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === list.length - 1)) return list;

    const next = [...list];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    return next;
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const moveDeep = (list: ReportBlock[]): ReportBlock[] => {
      const moved = moveBlockInList(list, id, direction);
      if (moved !== list) return moved;

      return list.map((block) => {
        let next = block;

        if (next.metadata?.containerBlocks) {
          next = {
            ...next,
            metadata: {
              ...next.metadata,
              containerBlocks: moveDeep(next.metadata.containerBlocks),
            },
          };
        }

        if (next.metadata?.columns) {
          next = {
            ...next,
            metadata: {
              ...next.metadata,
              columns: next.metadata.columns.map(moveDeep),
            },
          };
        }

        return next;
      });
    };

    onBlocksChange(moveDeep(chapter.blocks));
  };

  const renderList = (
    list: ReportBlock[],
    scope: AddTarget['scope'],
    containerId?: string,
    columnsId?: string,
    columnIndex?: number
  ) => {
    const buildTarget = (afterId: string | null): AddTarget => {
      if (scope === 'root') return { scope: 'root', afterId };
      if (scope === 'container' && containerId) return { scope: 'container', containerId, afterId };
      return { scope: 'column', columnsId: columnsId || '', columnIndex: columnIndex || 0, afterId };
    };

    return (
      <div className="space-y-3">
        {list.length === 0 && (
          <button
            onClick={(e) => openSlash(buildTarget(null), e)}
            className="w-full py-4 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-black hover:text-black transition"
          >
            + Block hinzufügen
          </button>
        )}

        {list.map((block, idx) => (
          <div key={block.id}>
            <div className={`group relative rounded-lg border-2 p-4 ${editingBlockId === block.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => moveBlock(block.id, 'up')} className="p-1 rounded hover:bg-gray-200" title="Nach oben"><MoveUp size={14} /></button>
                <button onClick={() => moveBlock(block.id, 'down')} className="p-1 rounded hover:bg-gray-200" title="Nach unten"><MoveDown size={14} /></button>
                <button onClick={() => duplicateBlock(block.id)} className="p-1 rounded hover:bg-gray-200" title="Duplizieren"><Copy size={14} /></button>
                <button onClick={() => deleteBlock(block.id)} className="p-1 rounded hover:bg-red-100 text-red-600" title="Löschen"><Trash2 size={14} /></button>
              </div>

              <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{block.type}</div>
              {renderBlock(block)}
            </div>

            <div className="my-2 flex justify-center">
              <button
                onClick={(e) => openSlash(buildTarget(block.id), e)}
                className="px-3 py-1 text-[11px] text-gray-500 hover:text-black hover:bg-gray-100 rounded"
              >
                + Block
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const highlightPalette = useMemo(() => ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'], []);

  const renderBlock = (block: ReportBlock): React.ReactNode => {
    switch (block.type) {
      case 'h1':
        return <input className="w-full text-4xl font-black outline-none bg-transparent" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} />;
      case 'h2':
        return <input className="w-full text-3xl font-bold outline-none bg-transparent" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} />;
      case 'h3':
        return <input className="w-full text-2xl font-semibold outline-none bg-transparent" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} />;
      case 'text':
        return <textarea className="w-full min-h-[90px] text-base text-gray-700 outline-none bg-transparent resize-y" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} />;
      case 'highlight': {
        const color = block.metadata?.highlightColor || '#f59e0b';
        const icon = block.metadata?.highlightIcon || '💡';
        const opacity = Math.min(1, Math.max(0, Number(block.metadata?.highlightOpacity ?? 0.12)));
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {highlightPalette.map((paletteColor) => (
                <button key={`${block.id}-${paletteColor}`} style={{ backgroundColor: paletteColor }} className={`h-6 w-6 rounded border ${paletteColor === color ? 'border-black' : 'border-gray-200'}`} onClick={() => updateBlock(block.id, { metadata: { highlightColor: paletteColor } })} />
              ))}
            </div>
            <div className="flex gap-2">
              <select className="border border-gray-200 rounded px-2 py-1 text-xs" value={icon} onChange={(e) => updateBlock(block.id, { metadata: { highlightIcon: e.target.value as ReportBlock['metadata']['highlightIcon'] } })}>
                <option value="💡">💡</option>
                <option value="ℹ️">ℹ️</option>
                <option value="⚠️">⚠️</option>
                <option value="🛑">🛑</option>
                <option value="✅">✅</option>
              </select>
              <input type="color" value={color} onChange={(e) => updateBlock(block.id, { metadata: { highlightColor: e.target.value } })} className="h-8 w-10 rounded border border-gray-200" />
              <input type="range" min={0} max={100} value={Math.round(opacity * 100)} onChange={(e) => updateBlock(block.id, { metadata: { highlightOpacity: Number(e.target.value) / 100 } })} className="flex-1" />
            </div>
            <div className="rounded-xl border px-3 py-2" style={{ borderColor: color, backgroundColor: `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` }}>
              <textarea className="w-full bg-transparent outline-none resize-y" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} />
            </div>
          </div>
        );
      }
      case 'bullets': {
        const listStyle = block.metadata?.listStyle || 'bullets';
        const lines = block.content.split('\n').map((line) => line.trim()).filter(Boolean);
        return (
          <div className="space-y-3">
            <select className="border border-gray-200 rounded px-2 py-1 text-xs" value={listStyle} onChange={(e) => updateBlock(block.id, { metadata: { listStyle: e.target.value as 'bullets' | 'numbered' } })}>
              <option value="bullets">• Bullets</option>
              <option value="numbered">1. Numbered</option>
            </select>
            <textarea className="w-full min-h-[80px] border border-gray-200 rounded p-2" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} />
            {lines.length > 0 && (
              <ul className={`${listStyle === 'numbered' ? 'list-decimal' : 'list-disc'} pl-6 text-sm text-gray-600 space-y-1`}>
                {lines.map((line, idx) => <li key={`${block.id}-line-${idx}`}>{line}</li>)}
              </ul>
            )}
          </div>
        );
      }
      case 'image': {
        const src = block.metadata?.src || '';
        const isUploading = uploadingBlockId === block.id;
        return (
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden bg-gray-100 min-h-[140px]">
              {src ? <img src={src} className="w-full" alt="Block" /> : <div className="p-8 text-center text-gray-400">Kein Bild</div>}
              {isUploading && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
            </div>
            <div className="flex gap-2">
              <input type="text" className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs" value={src} placeholder="Bild-URL" onChange={(e) => updateBlock(block.id, { metadata: { src: e.target.value } })} />
              <label className="px-3 py-1 rounded bg-black text-white text-xs cursor-pointer inline-flex items-center gap-1">
                <UploadCloud size={14} /> Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !onImageUpload) return;
                    await onImageUpload(block.id, file);
                  }}
                />
              </label>
            </div>
            <input type="text" className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.caption || ''} placeholder="Bildunterschrift" onChange={(e) => updateBlock(block.id, { metadata: { caption: e.target.value } })} />
          </div>
        );
      }
      case 'gallery':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(block.metadata?.images || []).map((image) => (
              <div key={image.id} className="space-y-1">
                <img src={image.src} alt={image.caption || 'Gallery'} className="w-full aspect-square object-cover rounded" />
                <input
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                  value={image.caption || ''}
                  onChange={(e) => {
                    const images = (block.metadata?.images || []).map((item) => item.id === image.id ? { ...item, caption: e.target.value } : item);
                    updateBlock(block.id, { metadata: { images } });
                  }}
                />
              </div>
            ))}
          </div>
        );
      case 'divider':
        return <div className="h-px bg-gray-300" />;
      case 'spacer':
        return (
          <div>
            <input type="range" min={8} max={200} value={block.metadata?.fontSize || 40} onChange={(e) => updateBlock(block.id, { metadata: { fontSize: Number(e.target.value) } })} className="w-full" />
            <div style={{ height: `${block.metadata?.fontSize || 40}px` }} className="border-l-2 border-dashed border-gray-300 mt-2" />
          </div>
        );
      case 'quote-block':
        return <textarea className="w-full min-h-[80px] italic border-l-4 border-blue-500 pl-3 outline-none" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} />;
      case 'citation':
        return (
          <div className="space-y-2 border-l-4 border-gray-300 pl-3">
            <textarea className="w-full min-h-[70px] italic outline-none" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} />
            <input className="w-full max-w-xs border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.citationAuthor || ''} placeholder="Autor" onChange={(e) => updateBlock(block.id, { metadata: { citationAuthor: e.target.value } })} />
          </div>
        );
      case 'button':
        return (
          <div className="space-y-2">
            <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.buttonText || ''} placeholder="Button Text" onChange={(e) => updateBlock(block.id, { metadata: { buttonText: e.target.value } })} />
            <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.buttonLink || ''} placeholder="Button URL" onChange={(e) => updateBlock(block.id, { metadata: { buttonLink: e.target.value } })} />
            <a href={block.metadata?.buttonLink || '#'} className="inline-flex px-4 py-2 rounded bg-black text-white text-xs font-bold">{block.metadata?.buttonText || 'Button'}</a>
          </div>
        );
      case 'link':
        return (
          <div className="space-y-2">
            <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} />
            <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.link || ''} placeholder="https://example.com" onChange={(e) => updateBlock(block.id, { metadata: { link: e.target.value } })} />
            <a href={block.metadata?.link || '#'} className="text-sm underline">{block.content || 'Link'}</a>
          </div>
        );
      case 'cta': {
        const align = block.metadata?.alignment || 'center';
        return (
          <div className="space-y-2">
            <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.title || ''} placeholder="CTA Titel" onChange={(e) => updateBlock(block.id, { metadata: { title: e.target.value } })} />
            <textarea className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.description || ''} placeholder="CTA Beschreibung" onChange={(e) => updateBlock(block.id, { metadata: { description: e.target.value } })} />
            <div className="grid grid-cols-2 gap-2">
              <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.buttonText || ''} placeholder="Button Text" onChange={(e) => updateBlock(block.id, { metadata: { buttonText: e.target.value } })} />
              <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.buttonLink || ''} placeholder="Button Link" onChange={(e) => updateBlock(block.id, { metadata: { buttonLink: e.target.value } })} />
            </div>
            <select className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={align} onChange={(e) => updateBlock(block.id, { metadata: { alignment: e.target.value as 'left' | 'center' | 'right' } })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
            <div className={`rounded-xl border p-4 ${align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'}`}>
              <h4 className="text-lg font-bold">{block.metadata?.title || 'Ready to start?'}</h4>
              <p className="text-sm text-gray-500 mt-1">{block.metadata?.description || 'Contact us today.'}</p>
            </div>
          </div>
        );
      }
      case 'faq': {
        const items = block.metadata?.faqItems || [];
        return (
          <div className="space-y-2">
            <button
              className="px-2 py-1 text-xs rounded bg-black text-white"
              onClick={() => updateBlock(block.id, { metadata: { faqItems: [...items, { id: `faq-${Date.now()}`, question: 'Neue Frage', answer: 'Neue Antwort' }] } })}
            >
              + FAQ hinzufügen
            </button>
            {items.map((item, idx) => (
              <div key={item.id} className="border border-gray-200 rounded p-2 space-y-1">
                <input
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                  value={item.question}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...item, question: e.target.value };
                    updateBlock(block.id, { metadata: { faqItems: next } });
                  }}
                />
                <textarea
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                  value={item.answer}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...item, answer: e.target.value };
                    updateBlock(block.id, { metadata: { faqItems: next } });
                  }}
                />
                <button
                  className="text-xs text-red-600"
                  onClick={() => updateBlock(block.id, { metadata: { faqItems: items.filter((faq) => faq.id !== item.id) } })}
                >
                  Entfernen
                </button>
              </div>
            ))}
          </div>
        );
      }
      case 'table': {
        const data = block.metadata?.tableData || [];
        const colCount = data.length > 0 ? data[0].length : 0;

        const addRow = () => {
          if (data.length === 0) {
            updateBlock(block.id, { metadata: { tableData: [['', '', '']] } });
          } else {
            const newRow = Array(colCount).fill('');
            updateBlock(block.id, { metadata: { tableData: [...data, newRow] } });
          }
        };

        const deleteRow = (rowIdx: number) => {
          const next = data.filter((_, idx) => idx !== rowIdx);
          updateBlock(block.id, { metadata: { tableData: next } });
        };

        const addColumn = () => {
          if (data.length === 0) {
            updateBlock(block.id, { metadata: { tableData: [['', '']] } });
          } else {
            const next = data.map((row) => [...row, '']);
            updateBlock(block.id, { metadata: { tableData: next } });
          }
        };

        const deleteColumn = (colIdx: number) => {
          const next = data.map((row) => row.filter((_, idx) => idx !== colIdx));
          updateBlock(block.id, { metadata: { tableData: next } });
        };

        return (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <button
                className="px-3 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
                onClick={addRow}
              >
                + Zeile hinzufügen
              </button>
              <button
                className="px-3 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600"
                onClick={addColumn}
              >
                + Spalte hinzufügen
              </button>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={block.metadata?.tableHeader || false}
                  onChange={(e) => updateBlock(block.id, { metadata: { tableHeader: e.target.checked } })}
                />
                Header-Zeile
              </label>
            </div>

            <div className="overflow-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <tbody>
                  {data.map((row, rowIdx) => (
                    <tr key={`${block.id}-row-${rowIdx}`} className={rowIdx === 0 && block.metadata?.tableHeader ? 'bg-gray-100 font-semibold' : ''}>
                      {row.map((cell, cellIdx) => (
                        <td key={`${block.id}-cell-${rowIdx}-${cellIdx}`} className="border border-gray-300 px-2 py-1 relative group">
                          <input
                            className="w-full bg-transparent outline-none"
                            value={cell}
                            onChange={(e) => {
                              const next = data.map((line) => [...line]);
                              next[rowIdx][cellIdx] = e.target.value;
                              updateBlock(block.id, { metadata: { tableData: next } });
                            }}
                          />
                          {data.length > 1 && cellIdx === row.length - 1 && (
                            <button
                              className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded text-red-600 hover:bg-red-100 text-xs"
                              onClick={() => deleteRow(rowIdx)}
                              title="Zeile löschen"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {colCount > 1 && (
              <div className="flex gap-1 flex-wrap text-xs">
                {Array.from({ length: colCount }).map((_, colIdx) => (
                  <button
                    key={`del-col-${colIdx}`}
                    className="px-2 py-1 rounded text-red-600 hover:bg-red-100 border border-red-300"
                    onClick={() => deleteColumn(colIdx)}
                  >
                    Spalte {colIdx + 1} löschen
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'metrics':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(block.metadata?.metricsData || []).map((metric, idx) => (
              <div key={metric.id} className="border border-gray-200 rounded p-2 space-y-1">
                <input className="w-full text-xs border border-gray-200 rounded px-2 py-1" value={metric.label} onChange={(e) => {
                  const next = [...(block.metadata?.metricsData || [])];
                  next[idx] = { ...metric, label: e.target.value };
                  updateBlock(block.id, { metadata: { metricsData: next } });
                }} />
                <input className="w-full text-sm font-bold border border-gray-200 rounded px-2 py-1" value={metric.value} onChange={(e) => {
                  const next = [...(block.metadata?.metricsData || [])];
                  next[idx] = { ...metric, value: e.target.value };
                  updateBlock(block.id, { metadata: { metricsData: next } });
                }} />
              </div>
            ))}
          </div>
        );
      case 'timeline':
        return (
          <div className="space-y-2">
            {(block.metadata?.timelineItems || []).map((item, idx) => (
              <div key={item.id} className="grid grid-cols-4 gap-2">
                <input className="border border-gray-200 rounded px-2 py-1 text-xs" value={item.date} onChange={(e) => {
                  const next = [...(block.metadata?.timelineItems || [])];
                  next[idx] = { ...item, date: e.target.value };
                  updateBlock(block.id, { metadata: { timelineItems: next } });
                }} />
                <input className="border border-gray-200 rounded px-2 py-1 text-xs" value={item.title} onChange={(e) => {
                  const next = [...(block.metadata?.timelineItems || [])];
                  next[idx] = { ...item, title: e.target.value };
                  updateBlock(block.id, { metadata: { timelineItems: next } });
                }} />
                <input className="col-span-2 border border-gray-200 rounded px-2 py-1 text-xs" value={item.description} onChange={(e) => {
                  const next = [...(block.metadata?.timelineItems || [])];
                  next[idx] = { ...item, description: e.target.value };
                  updateBlock(block.id, { metadata: { timelineItems: next } });
                }} />
              </div>
            ))}
          </div>
        );
      case 'video':
        return <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.src || ''} placeholder="YouTube/Vimeo URL" onChange={(e) => updateBlock(block.id, { metadata: { src: e.target.value } })} />;
      case 'embed':
        return (
          <div className="space-y-2">
            <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.src || ''} placeholder="Embed URL" onChange={(e) => updateBlock(block.id, { metadata: { src: e.target.value } })} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.embedWidth || 1000} onChange={(e) => updateBlock(block.id, { metadata: { embedWidth: Number(e.target.value) || 1000 } })} />
              <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.embedHeight || 420} onChange={(e) => updateBlock(block.id, { metadata: { embedHeight: Number(e.target.value) || 420 } })} />
            </div>
          </div>
        );
      case 'database':
        return (
          <div className="space-y-2">
            <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.collectionName || ''} placeholder="Collection Name" onChange={(e) => updateBlock(block.id, { metadata: { collectionName: e.target.value } })} />
            <select className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.dbView || 'grid'} onChange={(e) => updateBlock(block.id, { metadata: { dbView: e.target.value as 'grid' | 'list' } })}>
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </div>
        );
      case 'columns': {
        const count = block.metadata?.columnCount || 2;
        const columns = Array.from({ length: count }, (_, idx) => block.metadata?.columns?.[idx] || []);
        const gridClass = count === 2 ? 'md:grid-cols-2' : count === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4';

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Columns</span>
              <select
                className="border border-gray-200 rounded px-2 py-1 text-xs"
                value={count}
                onChange={(e) => {
                  const nextCount = Number(e.target.value);
                  const resized = Array.from({ length: nextCount }, (_, idx) => columns[idx] || []);
                  updateBlock(block.id, { metadata: { columnCount: nextCount, columns: resized } });
                }}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <div className={`grid grid-cols-1 ${gridClass} gap-4`}>
              {columns.map((column, idx) => (
                <div key={`${block.id}-col-${idx}`} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-2 text-xs font-semibold text-gray-500">Spalte {idx + 1}</div>
                  {renderList(column, 'column', undefined, block.id, idx)}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'container': {
        const color = block.metadata?.containerBgColor || '#f9fafb';
        const opacity = Math.min(1, Math.max(0, Number(block.metadata?.containerOpacity ?? 0.1)));
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {highlightPalette.map((paletteColor) => (
                <button key={`${block.id}-${paletteColor}`} style={{ backgroundColor: paletteColor }} className={`h-6 w-6 rounded border ${paletteColor === color ? 'border-black' : 'border-gray-200'}`} onClick={() => updateBlock(block.id, { metadata: { containerBgColor: paletteColor } })} />
              ))}
              <input type="color" value={color} onChange={(e) => updateBlock(block.id, { metadata: { containerBgColor: e.target.value } })} className="h-8 w-10 rounded border border-gray-200" />
              <input type="range" min={0} max={100} value={Math.round(opacity * 100)} onChange={(e) => updateBlock(block.id, { metadata: { containerOpacity: Number(e.target.value) / 100 } })} className="flex-1 min-w-[120px]" />
            </div>
            <div className="relative rounded-xl border p-3 overflow-hidden">
              <div className="absolute inset-0 rounded-xl" style={{ backgroundColor: color, opacity }} />
              <div className="relative z-10">
                {renderList(block.metadata?.containerBlocks || [], 'container', block.id)}
              </div>
            </div>
          </div>
        );
      }
      case 'page-break':
        return <div className="flex items-center justify-center py-4 text-sm text-gray-500 border-t-2 border-dashed border-gray-300">📄 Seitenumbruch</div>;
      case 'chapter-divider':
        return (
          <div className="space-y-2 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <input type="number" className="w-28 border border-gray-200 rounded px-2 py-1 text-xs" value={block.metadata?.chapterNumber || 1} onChange={(e) => updateBlock(block.id, { metadata: { chapterNumber: Number(e.target.value) || 1 } })} />
          <input className="w-full text-2xl font-bold bg-transparent outline-none" placeholder="Chapter Title" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} />
          </div>
        );
      case 'cover-page':
        return (
          <div className="space-y-4 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg text-white">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Variante</label>
              <select
                value={block.metadata?.coverPageVariant || 'standard'}
                onChange={(e) => updateBlock(block.id, { metadata: { ...block.metadata, coverPageVariant: e.target.value as 'standard' | 'minimal' | 'luxury' } })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white text-sm border border-slate-600"
              >
                <option value="standard">Standard</option>
                <option value="minimal">Minimal</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Titel</label>
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white text-lg font-bold outline-none border border-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Subtitle</label>
              <input
                type="text"
                value={block.metadata?.coverPageSubtitle || ''}
                onChange={(e) => updateBlock(block.id, { metadata: { ...block.metadata, coverPageSubtitle: e.target.value } })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white outline-none border border-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Version</label>
              <input
                type="text"
                value={block.metadata?.coverPageVersion || ''}
                onChange={(e) => updateBlock(block.id, { metadata: { ...block.metadata, coverPageVersion: e.target.value } })}
                placeholder="z.B. 1.0"
                className="w-full px-3 py-2 rounded bg-slate-700 text-white outline-none border border-slate-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Vertraulichkeit</label>
              <select
                value={block.metadata?.coverPageConfidentiality || 'Confidential'}
                onChange={(e) => updateBlock(block.id, { metadata: { ...block.metadata, coverPageConfidentiality: e.target.value } })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white text-sm border border-slate-600"
              >
                <option value="Public">Public</option>
                <option value="Internal">Internal</option>
                <option value="Confidential">Confidential</option>
                <option value="Restricted">Restricted</option>
              </select>
            </div>
          </div>
        );
      case 'toc':
        return <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-500">Inhaltsverzeichnis wird beim Export generiert.</div>;
      default:
        return <div className="text-sm text-red-500">Unbekannter Block: {block.type}</div>;
    }
  };

  return (
    <div className="space-y-3">
      {renderList(chapter.blocks, 'root')}

      <SlashMenu
        isOpen={slashMenuOpen}
        position={slashMenuPos}
        onSelect={addBlock}
        onClose={() => setSlashMenuOpen(false)}
      />
    </div>
  );
};

export default BlockEditor;
