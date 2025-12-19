'use client';

import {
    Bold, Italic, Underline, List, ListOrdered,
    AlignLeft, AlignCenter, AlignRight,
    Heading1, Heading2, Highlighter, Type,
    Undo, Redo
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    disabled?: boolean;
}

export default function RichTextEditor({ value, onChange, disabled }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Initial value sync
    useEffect(() => {
        if (!isMounted && editorRef.current && value) {
            editorRef.current.innerHTML = value;
            setIsMounted(true);
        }
    }, [value, isMounted]);

    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        syncChange();
    };

    const syncChange = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            {/* Toolbar */}
            <div className={`flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <ToolbarBtn icon={Undo} onClick={() => exec('undo')} title="Undo" />
                <ToolbarBtn icon={Redo} onClick={() => exec('redo')} title="Redo" />
                <div className="w-px h-5 bg-slate-300 mx-1"></div>

                <ToolbarBtn icon={Bold} onClick={() => exec('bold')} title="Bold" />
                <ToolbarBtn icon={Italic} onClick={() => exec('italic')} title="Italic" />
                <ToolbarBtn icon={Underline} onClick={() => exec('underline')} title="Underline" />

                <div className="w-px h-5 bg-slate-300 mx-1"></div>

                <ToolbarBtn icon={Heading1} onClick={() => exec('formatBlock', '<h1>')} title="Large Heading" />
                <ToolbarBtn icon={Heading2} onClick={() => exec('formatBlock', '<h2>')} title="Medium Heading" />

                <div className="w-px h-5 bg-slate-300 mx-1"></div>

                <div className="flex items-center mx-1" title="Text Color">
                    <Type className="w-4 h-4 text-slate-500 mr-1" />
                    <input
                        type="color"
                        onChange={(e) => exec('foreColor', e.target.value)}
                        className="w-5 h-5 cursor-pointer bg-transparent border-none p-0"
                    />
                </div>

                <div className="flex items-center mx-1" title="Highlight Color">
                    <Highlighter className="w-4 h-4 text-slate-500 mr-1" />
                    <input
                        type="color"
                        onChange={(e) => exec('hiliteColor', e.target.value)}
                        className="w-5 h-5 cursor-pointer bg-transparent border-none p-0"
                        defaultValue="#ffff00"
                    />
                </div>

                <div className="w-px h-5 bg-slate-300 mx-1"></div>

                <ToolbarBtn icon={List} onClick={() => exec('insertUnorderedList')} title="Bullet List" />
                <ToolbarBtn icon={ListOrdered} onClick={() => exec('insertOrderedList')} title="Numbered List" />

                <div className="w-px h-5 bg-slate-300 mx-1"></div>

                <ToolbarBtn icon={AlignLeft} onClick={() => exec('justifyLeft')} title="Align Left" />
                <ToolbarBtn icon={AlignCenter} onClick={() => exec('justifyCenter')} title="Align Center" />
                <ToolbarBtn icon={AlignRight} onClick={() => exec('justifyRight')} title="Align Right" />
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable={!disabled}
                onInput={syncChange}
                className="min-h-[300px] p-4 focus:outline-none prose prose-sm max-w-none text-slate-700"
                style={{ lineHeight: '1.5' }}
            />
        </div>
    );
}

function ToolbarBtn({ icon: Icon, onClick, title }: { icon: any, onClick: () => void, title: string }) {
    return (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            title={title}
            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors"
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}
