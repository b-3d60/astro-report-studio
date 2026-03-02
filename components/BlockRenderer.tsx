import React from 'react';
import { ReportBlock } from '../types';

interface BlockRendererProps {
  block: ReportBlock;
  isEditing?: boolean;
  onContentChange?: (content: string) => void;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  isEditing = false,
  onContentChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLDivElement>) => {
    if (onContentChange) {
      const text = e.currentTarget instanceof HTMLTextAreaElement
        ? e.currentTarget.value
        : e.currentTarget.textContent || '';
      onContentChange(text);
    }
  };

  const commonEditClasses = isEditing ? 'bg-blue-50 border border-blue-200 rounded px-2 py-1' : '';

  switch (block.type) {
    case 'h1':
      return (
        <h1
          contentEditable={isEditing}
          suppressContentEditableWarning={isEditing}
          onInput={handleChange as any}
          className={`text-4xl font-bold mb-6 leading-tight ${commonEditClasses}`}
        >
          {block.content}
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
          {block.content}
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
          {block.content}
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
          {block.content}
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
              {block.content}
            </p>
          </div>
        </div>
      );

    case 'bullets':
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
            />
          )}
          {block.metadata?.caption && (
            <p className="text-sm text-gray-500 text-center italic">
              {block.metadata.caption}
            </p>
          )}
        </div>
      );

    case 'spacer':
      return <div className="mb-4" style={{ height: `${block.metadata?.fontSize || 32}px` }} />;

    case 'divider':
      return <hr className="my-6 border-t border-gray-300" />;

    case 'quote-block':
      return (
        <blockquote className="italic text-lg border-l-4 border-blue-500 pl-4 py-2 my-4 text-gray-600">
          "{block.content}"
        </blockquote>
      );

    case 'table':
      return (
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              {block.metadata?.tableData?.map((row, idx) => (
                <tr key={idx} className={idx === 0 ? 'bg-gray-100' : ''}>
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
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {block.metadata?.metricsData?.map(metric => (
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
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {block.metadata?.images?.map(img => (
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
          className="p-6 rounded-lg mb-4 border"
          style={{
            backgroundColor: block.metadata?.containerBgColor || 'transparent',
            opacity: block.metadata?.containerOpacity,
          }}
        >
          <div className="text-sm text-gray-500">Container</div>
        </div>
      );

    case 'columns-2':
    case 'columns-3':
    case 'columns-4':
      const numCols = parseInt(block.type.split('-')[1]);
      return (
        <div className={`grid gap-6 mb-6 grid-cols-${numCols}`}>
          {block.metadata?.columns?.map((col, idx) => (
            <div key={idx} className="bg-gray-50 rounded p-4 text-sm text-gray-500">
              Column {idx + 1}
            </div>
          ))}
        </div>
      );

    case 'timeline':
      return (
        <div className="mb-6 space-y-4">
          {block.metadata?.timelineItems?.map(item => (
            <div key={item.id} className="flex gap-4">
              <div className="w-20 text-sm font-semibold text-gray-600">{item.date}</div>
              <div>
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className="text-gray-500 text-sm">
          Block type: {block.type}
        </div>
      );
  }
};

export default BlockRenderer;
