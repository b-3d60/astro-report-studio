import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  ChevronDown,
} from 'lucide-react';
import { Chapter, ReportBlock, ReportBlockType } from '../types';
import BlockRenderer from './BlockRenderer';
import SlashMenu from './SlashMenu';

interface BlockEditorProps {
  chapter: Chapter;
  onBlocksChange: (blocks: ReportBlock[]) => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
  chapter,
  onBlocksChange,
}) => {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);
  const [slashMenuPos, setSlashMenuPos] = useState({ x: 0, y: 0 });

  const handleBlockContentChange = (blockId: string, content: string) => {
    const updated = chapter.blocks.map(b =>
      b.id === blockId ? { ...b, content } : b
    );
    onBlocksChange(updated);
  };

  const handleAddBlock = (blockId: string | null, type: ReportBlockType) => {
    const newBlock: ReportBlock = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      metadata: {},
    };

    let updated: ReportBlock[];
    if (!blockId) {
      updated = [...chapter.blocks, newBlock];
    } else {
      const index = chapter.blocks.findIndex(b => b.id === blockId);
      updated = [
        ...chapter.blocks.slice(0, index + 1),
        newBlock,
        ...chapter.blocks.slice(index + 1),
      ];
    }

    onBlocksChange(updated);
    setSlashMenuOpen(false);
    setEditingBlockId(newBlock.id);
  };

  const handleDeleteBlock = (blockId: string) => {
    const updated = chapter.blocks.filter(b => b.id !== blockId);
    onBlocksChange(updated);
  };

  const handleDuplicateBlock = (blockId: string) => {
    const block = chapter.blocks.find(b => b.id === blockId);
    if (block) {
      const newBlock = { ...block, id: `block-${Date.now()}` };
      const index = chapter.blocks.findIndex(b => b.id === blockId);
      const updated = [
        ...chapter.blocks.slice(0, index + 1),
        newBlock,
        ...chapter.blocks.slice(index + 1),
      ];
      onBlocksChange(updated);
    }
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = chapter.blocks.findIndex(b => b.id === blockId);
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < chapter.blocks.length - 1)
    ) {
      const updated = [...chapter.blocks];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      onBlocksChange(updated);
    }
  };

  const openSlashMenu = (blockId: string | null, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSlashMenuBlockId(blockId);
    setSlashMenuPos({ x: rect.left, y: rect.bottom + 4 });
    setSlashMenuOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Add First Block Button */}
      {chapter.blocks.length === 0 && (
        <button
          onClick={e => openSlashMenu(null, e)}
          className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Jeden Block hinzufügen
        </button>
      )}

      {/* Blocks */}
      {chapter.blocks.map((block, idx) => (
        <div key={block.id}>
          {/* Block Container */}
          <div
            className={`group relative p-4 rounded-lg border-2 transition ${
              editingBlockId === block.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onFocus={() => setEditingBlockId(block.id)}
            onBlur={() => setEditingBlockId(null)}
          >
            {/* Block Controls */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => handleMoveBlock(block.id, 'up')}
                disabled={idx === 0}
                className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move up"
              >
                <MoveUp size={16} />
              </button>
              <button
                onClick={() => handleMoveBlock(block.id, 'down')}
                disabled={idx === chapter.blocks.length - 1}
                className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move down"
              >
                <MoveDown size={16} />
              </button>
              <button
                onClick={() => handleDuplicateBlock(block.id)}
                className="p-1 hover:bg-gray-200 rounded"
                title="Duplicate"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={() => handleDeleteBlock(block.id)}
                className="p-1 hover:bg-red-100 text-red-600 rounded"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Block Type Badge */}
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {block.type}
            </div>

            {/* Block Content */}
            <div onClick={() => setEditingBlockId(block.id)}>
              <BlockRenderer
                block={block}
                isEditing={editingBlockId === block.id}
                onContentChange={content =>
                  handleBlockContentChange(block.id, content)
                }
              />
            </div>
          </div>

          {/* Add Block Button (between blocks) */}
          {idx < chapter.blocks.length - 1 && (
            <div className="flex items-center justify-center my-2">
              <button
                onClick={e => openSlashMenu(block.id, e)}
                className="px-4 py-1 text-xs text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded transition opacity-0 hover:opacity-100"
              >
                + Block hinzufügen
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add Block After Last Block */}
      {chapter.blocks.length > 0 && (
        <button
          onClick={e =>
            openSlashMenu(chapter.blocks[chapter.blocks.length - 1].id, e)
          }
          className="w-full py-4 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Block hinzufügen
        </button>
      )}

      {/* Slash Menu */}
      <SlashMenu
        isOpen={slashMenuOpen}
        position={slashMenuPos}
        onSelect={type => handleAddBlock(slashMenuBlockId, type)}
        onClose={() => setSlashMenuOpen(false)}
      />
    </div>
  );
};

export default BlockEditor;
