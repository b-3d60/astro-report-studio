import React from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { ReportBlock } from '../types';

interface BlockRendererProps {
  block: ReportBlock;
  isEditing?: boolean;
  onContentChange?: (content: string) => void;
  onImageUpload?: (file: File) => Promise<void>;
  isUploading?: boolean;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  isEditing = false,
  onContentChange,
  onImageUpload,
  isUploading = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLDivElement>) => {
    if (onContentChange) {
      const text = e.currentTarget instanceof HTMLTextAreaElement
        ? e.currentTarget.value
        : e.currentTarget.textContent || '';
      onContentChange(text);
    }
  };

  const commonEditClasses = isEditing ? 'outline-blue-500 outline-2 outline-dashed' : '';

  switch (block.type) {
    case 'h1':
      return (
        <h1
          contentEditable={isEditing}
          suppressContentEditableWarning={isEditing}
          onInput={handleChange as any}
          className={`text-4xl font-bold mb-6 leading-tight ${commonEditClasses}`}
        >
          {block.content || 'Überschrift 1'}
        </h1>
      );

    case 'h2':
      return (
        <h2
          contentEditable={isEditing}
          suppressContentEditableWarning={isEditing}
          onInput={handleChange as any}
          className={`text-3xl font-bold mb-4 leading-tight ${commonEditClasses}`}
        >
          {block.content || 'Überschrift 2'}
        </h2>
      );

    case 'h3':
      return (
        <h3
          contentEditable={isEditing}
          suppressContentEditableWarning={isEditing}
          onInput={handleChange as any}
          className={`text-2xl font-semibold mb-3 leading-tight ${commonEditClasses}`}
        >
          {block.content || 'Überschrift 3'}
        </h3>
      );

    case 'text':
      return (
        <p
          contentEditable={isEditing}
          suppressContentEditableWarning={isEditing}
          onInput={handleChange as any}
          className={`text-lg leading-relaxed mb-4 text-gray-700 ${commonEditClasses}`}
        >
          {block.content || 'Text eingeben...'}
        </p>
      );

    case 'highlight':
      return (
        <div
          className={`p-4 rounded-lg mb-4 border-l-4 ${
            block.metadata?.highlightColor ? `border-blue-500 bg-blue-50` : 'border-yellow-500 bg-yellow-50'
          }`}
        >
          <div className="flex gap-2">
            <span className="text-xl">{block.metadata?.highlightIcon || '💡'}</span>
            <p
              contentEditable={isEditing}
              suppressContentEditableWarning={isEditing}
              onInput={handleChange as any}
              className={`flex-1 text-sm ${commonEditClasses}`}
            >
              {block.content || 'Hinweis...'}
            </p>
          </div>
        </div>
      );

    case 'bullets':
      if (isEditing) {
        return (
          <textarea
            value={block.content}
            onChange={(e) => onContentChange?.(e.target.value)}
            placeholder="Ein Punkt pro Zeile..."
            className="w-full p-3 border-2 border-blue-300 rounded bg-blue-50 text-gray-700 resize-none font-sans"
            rows={Math.max(3, block.content.split('\n').length)}
          />
        );
      }
      return (
        <ul className="mb-4 pl-6 space-y-2">
          {block.content.split('\n').filter(Boolean).map((item, idx) => (
            <li key={idx} className="text-gray-700 list-disc">
              {item}
            </li>
          ))}
        </ul>
      );

    case 'image':
      return (
        <div className="my-6">
          {block.metadata?.src && (
            <img
              src={block.metadata.src}
              alt={block.metadata.caption || 'Image'}
              className="w-full rounded-lg mb-2 object-cover max-h-96"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23ddd" width="800" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EBild nicht gefunden%3C/text%3E%3C/svg%3E';
              }}
            />
          )}
          {block.metadata?.caption && (
            <p className="text-sm text-gray-500 text-center italic">
              {block.metadata.caption}
            </p>
          )}
          {isEditing && (
            <div className="mt-3">
              {onImageUpload && (
                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg cursor-pointer hover:bg-blue-100 transition">
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Wird hochgeladen...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={18} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Bild hochladen oder ersetzen</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await onImageUpload(file);
                          }
                        }}
                        disabled={isUploading}
                      />
                    </>
                  )}
                </label>
              )}
              {!onImageUpload && (
                <div className="text-xs text-gray-500 italic">
                  💡 Tipp: Firebase Storage konfigurieren für Image Upload
                </div>
              )}
            </div>
          )}
        </div>
      );

    case 'spacer':
      return (
        <div 
          className="mb-4 border-l-2 border-dashed border-gray-300" 
          style={{ height: `${block.metadata?.fontSize || 32}px` }}
        >
          {isEditing && (
            <span className="text-xs text-gray-400">
              Spacer ({block.metadata?.fontSize || 32}px)
            </span>
          )}
        </div>
      );

    case 'divider':
      return <hr className="my-6 border-t-2 border-gray-300" />;

    case 'quote-block':
      return (
        <blockquote className="italic text-lg border-l-4 border-blue-500 pl-4 py-2 my-4 text-gray-600">
          <span
            contentEditable={isEditing}
            suppressContentEditableWarning={isEditing}
            onInput={handleChange as any}
            className={commonEditClasses}
          >
            {block.content || 'Zitat...'}
          </span>
        </blockquote>
      );

    case 'table':
      if (!block.metadata?.tableData || block.metadata.tableData.length === 0) {
        return (
          <div className="p-8 bg-gray-50 rounded-lg text-center text-gray-500 mb-4">
            <p>📊 Keine Tabellendaten vorhanden</p>
          </div>
        );
      }
      return (
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              {block.metadata.tableData.map((row, idx) => (
                <tr key={idx} className={idx === 0 && block.metadata?.tableHeader ? 'bg-gray-100 font-semibold' : ''}>
                  {row.map((cell, cidx) => (
                    <td
                      key={cidx}
                      className="border border-gray-300 px-4 py-2"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'metrics':
      if (!block.metadata?.metricsData || block.metadata.metricsData.length === 0) {
        return (
          <div className="p-8 bg-gray-50 rounded-lg text-center text-gray-500 mb-4">
            <p>📈 Keine Metriken vorhanden</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {block.metadata.metricsData.map(metric => (
            <div
              key={metric.id}
              className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg text-center"
            >
              <div className="text-3xl font-bold text-blue-600">{metric.value}</div>
              {metric.unit && <div className="text-sm text-gray-700">{metric.unit}</div>}
              <div className="text-sm font-medium text-gray-700 mt-2">{metric.label}</div>
            </div>
          ))}
        </div>
      );

    case 'gallery':
      if (!block.metadata?.images || block.metadata.images.length === 0) {
        return (
          <div className="p-8 bg-gray-50 rounded-lg text-center text-gray-500 mb-4">
            <p>🖼️ Keine Bilder in der Galerie</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {block.metadata.images.map(img => (
            <div key={img.id}>
              <img
                src={img.src}
                alt={img.caption || 'Gallery image'}
                className="w-full aspect-square object-cover rounded-lg"
              />
              {img.caption && (
                <p className="text-xs text-gray-500 mt-1 text-center">{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      );

    case 'container':
      return (
        <div
          className="relative p-6 rounded-lg mb-4 border-2 border-dashed border-gray-300 overflow-hidden"
        >
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              backgroundColor: block.metadata?.containerBgColor || '#f9fafb',
              opacity: block.metadata?.containerOpacity ?? 0.1,
            }}
          />
          <div className="relative z-10">
            <div className="text-sm text-gray-500 font-medium mb-2">📦 Container</div>
            <div className="text-xs text-gray-400">
              Verschachtelte Inhalte kommen bald
            </div>
          </div>
        </div>
      );

    case 'columns':
      const numCols = block.metadata?.columnCount || 2;
      const columns = Array.from({ length: numCols }, (_, idx) => block.metadata?.columns?.[idx] || []);
      const gridClass = numCols === 2 ? 'grid-cols-2' : numCols === 3 ? 'grid-cols-3' : 'grid-cols-4';
      return (
        <div className={`grid ${gridClass} gap-6 mb-6`}>
          {columns.map((columnBlocks, idx) => (
            <div key={idx} className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-700 space-y-2">
              <div className="font-medium mb-1 text-gray-600">Spalte {idx + 1}</div>
              {columnBlocks.length === 0 ? (
                <div className="text-xs text-gray-400">Leer</div>
              ) : (
                columnBlocks.map((nestedBlock) => (
                  <p key={nestedBlock.id} className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-100">
                    {nestedBlock.content}
                  </p>
                ))
              )}
            </div>
          ))}
        </div>
      );

    case 'timeline':
      if (!block.metadata?.timelineItems || block.metadata.timelineItems.length === 0) {
        return (
          <div className="p-8 bg-gray-50 rounded-lg text-center text-gray-500 mb-4">
            <p>🕐 Keine Timeline-Einträge</p>
          </div>
        );
      }
      return (
        <div className="mb-6 space-y-4">
          {block.metadata.timelineItems.map(item => (
            <div key={item.id} className="flex gap-4 items-start">
              <div className="w-20 text-sm font-semibold text-gray-600 pt-1">{item.date}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      );

    case 'page-break':
      return (
        <div className="my-8 flex items-center justify-center">
          <div className="border-t-4 border-dashed border-gray-400 flex-1"></div>
          <span className="px-4 text-sm font-medium text-gray-500 bg-gray-100 rounded">
            📄 Seitenumbruch
          </span>
          <div className="border-t-4 border-dashed border-gray-400 flex-1"></div>
        </div>
      );

    case 'chapter-divider':
      return (
        <div className="my-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
          <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-1">
            {block.metadata?.chapterNumber ? `Chapter ${block.metadata.chapterNumber}` : 'Chapter'}
          </div>
          <h3
            contentEditable={isEditing}
            suppressContentEditableWarning={isEditing}
            onInput={handleChange as any}
            className={`text-2xl font-bold text-gray-900 ${commonEditClasses}`}
          >
            {block.content || block.metadata?.chapterTitle || 'Chapter Title'}
          </h3>
        </div>
      );

    case 'toc':
      return (
        <div className="my-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Inhaltsverzeichnis</h3>
          <div className="text-sm text-gray-500 italic">
            Wird automatisch generiert beim Export
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">
          ⚠️ Block-Typ nicht unterstützt: <code className="font-mono bg-white px-2 py-1 rounded">{block.type}</code>
        </div>
      );
  }
};

export default BlockRenderer;
