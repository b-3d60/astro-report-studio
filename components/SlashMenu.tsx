import React, { useState, useEffect, useRef } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  Image as ImageIcon,
  Columns,
  Layout,
  LayoutGrid,
  ArrowUpDown,
  Minus,
  Quote,
  TableProperties,
  Zap,
  BarChart3,
  Clock,
} from 'lucide-react';
import { ReportBlockType } from '../types';

interface BlockCommand {
  type: ReportBlockType;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const BLOCK_COMMANDS: BlockCommand[] = [
  { type: 'h1', label: 'Heading 1', icon: <Heading1 size={18} />, shortcut: '# ' },
  { type: 'h2', label: 'Heading 2', icon: <Heading2 size={18} />, shortcut: '## ' },
  { type: 'h3', label: 'Heading 3', icon: <Heading3 size={18} />, shortcut: '### ' },
  { type: 'text', label: 'Text Block', icon: <Type size={18} /> },
  { type: 'highlight', label: 'Highlight', icon: <Zap size={18} />, shortcut: '/highlight' },
  { type: 'bullets', label: 'Bullet List', icon: <List size={18} />, shortcut: '/list' },
  { type: 'image', label: 'Image', icon: <ImageIcon size={18} />, shortcut: '/img' },
  { type: 'gallery', label: 'Gallery', icon: <LayoutGrid size={18} />, shortcut: '/gallery' },
  { type: 'columns-2', label: '2 Columns', icon: <Columns size={18} />, shortcut: '/2col' },
  { type: 'columns-3', label: '3 Columns', icon: <Columns size={18} />, shortcut: '/3col' },
  { type: 'columns-4', label: '4 Columns', icon: <Columns size={18} />, shortcut: '/4col' },
  { type: 'table', label: 'Table', icon: <TableProperties size={18} />, shortcut: '/table' },
  { type: 'metrics', label: 'Metrics', icon: <BarChart3 size={18} />, shortcut: '/metrics' },
  { type: 'timeline', label: 'Timeline', icon: <Clock size={18} />, shortcut: '/timeline' },
  { type: 'quote-block', label: 'Quote', icon: <Quote size={18} />, shortcut: '/quote' },
  { type: 'spacer', label: 'Spacer', icon: <ArrowUpDown size={18} />, shortcut: '/space' },
  { type: 'divider', label: 'Divider', icon: <Minus size={18} />, shortcut: '/line' },
  { type: 'container', label: 'Container', icon: <Layout size={18} />, shortcut: '/container' },
];

interface SlashMenuProps {
  isOpen: boolean;
  onSelect: (type: ReportBlockType) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

const SlashMenu: React.FC<SlashMenuProps> = ({
  isOpen,
  onSelect,
  onClose,
  position = { x: 0, y: 0 },
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = BLOCK_COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].type);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '320px',
        maxHeight: '400px',
      }}
    >
      {/* Search */}
      <div className="p-4 border-b border-gray-100">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search blocks..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setSelectedIndex(0);
          }}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm outline-none"
        />
      </div>

      {/* Commands */}
      <div className="overflow-y-auto max-h-[320px]">
        {filtered.length > 0 ? (
          filtered.map((cmd, idx) => (
            <button
              key={cmd.type}
              onClick={() => {
                onSelect(cmd.type);
              }}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${
                idx === selectedIndex
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="text-gray-500">{cmd.icon}</div>
              <div>
                <div className="text-sm font-medium">{cmd.label}</div>
                {cmd.shortcut && (
                  <div className="text-xs text-gray-500">{cmd.shortcut}</div>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No blocks found
          </div>
        )}
      </div>
    </div>
  );
};

export default SlashMenu;
