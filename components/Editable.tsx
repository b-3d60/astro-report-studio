import React, { useRef, useEffect } from 'react';

interface EditableProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

const Editable: React.FC<EditableProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
  multiline = false,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current && ref.current instanceof HTMLDivElement) {
      if (ref.current.textContent !== value) {
        ref.current.textContent = value;
      }
    }
  }, []);

  if (multiline) {
    return (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full outline-none resize-none ${className}`}
        style={{ minHeight: '100px' }}
      />
    );
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      contentEditable
      suppressContentEditableWarning
      onBlur={onBlur}
      onInput={e => {
        const text = (e.currentTarget as HTMLDivElement).textContent || '';
        onChange(text);
      }}
      className={`outline-none cursor-text ${className}`}
      data-placeholder={placeholder}
    />
  );
};

export default Editable;
