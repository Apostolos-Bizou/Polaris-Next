'use client';

import { useRef, useCallback } from 'react';
import './rich-editor.css';

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleFontSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    exec('fontSize', e.target.value);
  };

  const handleFontFamily = (e: React.ChangeEvent<HTMLSelectElement>) => {
    exec('fontName', e.target.value);
  };

  const handleColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    exec('foreColor', e.target.value);
  };

  const handleBgColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    exec('hiliteColor', e.target.value);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:', 'https://');
    if (url) exec('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:', 'https://');
    if (url) exec('insertImage', url);
  };

  return (
    <div className="re-container">
      {/* Toolbar */}
      <div className="re-toolbar">
        {/* Row 1: Font family + size */}
        <div className="re-toolbar-row">
          <select className="re-select font-family" onChange={handleFontFamily} defaultValue="Open Sans" title="Font Family">
            <option value="Open Sans">Open Sans</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Verdana">Verdana</option>
            <option value="Courier New">Courier New</option>
            <option value="Tahoma">Tahoma</option>
          </select>

          <select className="re-select font-size" onChange={handleFontSize} defaultValue="3" title="Font Size">
            <option value="1">Small</option>
            <option value="2">Normal-</option>
            <option value="3">Normal</option>
            <option value="4">Large</option>
            <option value="5">X-Large</option>
            <option value="6">XX-Large</option>
          </select>

          <div className="re-separator" />

          {/* Text color */}
          <label className="re-color-btn" title="Text Color">
            <span>A</span>
            <input type="color" defaultValue="#ffffff" onChange={handleColor} />
          </label>

          {/* Background color */}
          <label className="re-color-btn bg" title="Highlight Color">
            <span>▬</span>
            <input type="color" defaultValue="#D4AF37" onChange={handleBgColor} />
          </label>
        </div>

        {/* Row 2: Formatting */}
        <div className="re-toolbar-row">
          <button className="re-btn" onClick={() => exec('bold')} title="Bold"><b>B</b></button>
          <button className="re-btn" onClick={() => exec('italic')} title="Italic"><i>I</i></button>
          <button className="re-btn" onClick={() => exec('underline')} title="Underline"><u>U</u></button>
          <button className="re-btn" onClick={() => exec('strikeThrough')} title="Strikethrough"><s>S</s></button>

          <div className="re-separator" />

          <button className="re-btn" onClick={() => exec('justifyLeft')} title="Align Left">⫷</button>
          <button className="re-btn" onClick={() => exec('justifyCenter')} title="Align Center">☰</button>
          <button className="re-btn" onClick={() => exec('justifyRight')} title="Align Right">⫸</button>

          <div className="re-separator" />

          <button className="re-btn" onClick={() => exec('insertUnorderedList')} title="Bullet List">• List</button>
          <button className="re-btn" onClick={() => exec('insertOrderedList')} title="Numbered List">1. List</button>

          <div className="re-separator" />

          <button className="re-btn" onClick={insertLink} title="Insert Link">🔗</button>
          <button className="re-btn" onClick={insertImage} title="Insert Image">🖼️</button>
          <button className="re-btn" onClick={() => exec('insertHorizontalRule')} title="Horizontal Line">─</button>

          <div className="re-separator" />

          <button className="re-btn" onClick={() => exec('removeFormat')} title="Clear Formatting">✕</button>
          <button className="re-btn" onClick={() => exec('undo')} title="Undo">↩</button>
          <button className="re-btn" onClick={() => exec('redo')} title="Redo">↪</button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        className="re-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder || 'Type your email message here...'}
      />
    </div>
  );
}
