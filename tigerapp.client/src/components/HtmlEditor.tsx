import React, { useEffect, useRef, useState } from 'react';
import { FiAlignCenter, FiAlignLeft, FiAlignRight, FiBold, FiCode, FiCornerUpLeft, FiCornerUpRight, FiImage, FiItalic, FiLink, FiList, FiMinus, FiType } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { requestUrl } from '@/design-system/feedback';
import { validateMenuLink } from '@/utils/menuLinks';

interface HtmlEditorProps { value: string; onChange: (value: string) => void; }
type ToolbarAction = { label: string; icon: IconType; command?: string; special?: 'link' | 'image' };
const toolbar: ToolbarAction[] = [
  { label: 'ضخیم', icon: FiBold, command: 'bold' }, { label: 'مورب', icon: FiItalic, command: 'italic' },
  { label: 'زیرخط', icon: FiMinus, command: 'underline' }, { label: 'فهرست نقطه‌ای', icon: FiList, command: 'insertUnorderedList' },
  { label: 'راست‌چین', icon: FiAlignRight, command: 'justifyRight' }, { label: 'وسط‌چین', icon: FiAlignCenter, command: 'justifyCenter' },
  { label: 'چپ‌چین', icon: FiAlignLeft, command: 'justifyLeft' }, { label: 'لینک', icon: FiLink, special: 'link' },
  { label: 'تصویر', icon: FiImage, special: 'image' }, { label: 'بازگشت', icon: FiCornerUpRight, command: 'undo' },
  { label: 'انجام مجدد', icon: FiCornerUpLeft, command: 'redo' },
];

const HtmlEditor: React.FC<HtmlEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null); const [sourceMode, setSourceMode] = useState(false);
  useEffect(() => { if (!sourceMode && editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value; }, [value, sourceMode]);
  const run = (command: string, argument?: string) => { editorRef.current?.focus(); document.execCommand(command, false, argument); onChange(editorRef.current?.innerHTML || ''); };
  const insertUrl = async (image: boolean) => {
    const selection = window.getSelection();
    const range = selection?.rangeCount && editorRef.current?.contains(selection.anchorNode) ? selection.getRangeAt(0).cloneRange() : null;
    const url = await requestUrl(image ? 'درج تصویر' : 'درج پیوند', value => validateMenuLink(value) || (image && !/^(https?:\/\/|\/(?!\/))/i.test(value.trim()) ? 'برای تصویر، آدرس فایل داخلی یا http/https وارد کنید.' : null));
    if (!url || !editorRef.current?.isConnected) return;
    editorRef.current.focus();
    if (range) { const current = window.getSelection(); current?.removeAllRanges(); current?.addRange(range); }
    run(image ? 'insertImage' : 'createLink', url);
  };
  const handleToolbarAction = (item: ToolbarAction) => {
    if (item.special === 'link') void insertUrl(false);
    else if (item.special === 'image') void insertUrl(true);
    else if (item.command) run(item.command);
  };
  return <div className="html-editor" dir="rtl"><div className="html-editor-toolbar" role="toolbar" aria-label="ابزارهای ویرایش HTML">
    <select aria-label="قالب متن" defaultValue="p" onChange={event => run('formatBlock', event.target.value)}><option value="p">متن معمولی</option><option value="h2">تیتر اصلی</option><option value="h3">زیرتیتر</option><option value="blockquote">نقل‌قول</option></select>
    {toolbar.map(item => <button key={item.label} type="button" title={item.label} aria-label={item.label} onMouseDown={event => event.preventDefault()} onClick={() => handleToolbarAction(item)}><item.icon aria-hidden="true" /></button>)}
    <button type="button" className={sourceMode ? 'is-active' : ''} onClick={() => setSourceMode(mode => !mode)} aria-pressed={sourceMode} title="نمایش کد HTML"><FiCode aria-hidden="true" /><span>کد</span></button>
  </div>
  {sourceMode ? <textarea className="html-editor-source" value={value} onChange={event => onChange(event.target.value)} dir="ltr" spellCheck={false} aria-label="کد HTML" /> : <div ref={editorRef} className="html-editor-canvas" contentEditable suppressContentEditableWarning onInput={event => onChange(event.currentTarget.innerHTML)} data-placeholder="محتوای HTML را اینجا بنویسید…" role="textbox" aria-multiline="true" />}
  <div className="html-editor-footer"><span><FiType /> ویرایش دیداری و کد HTML</span><small>{value.length.toLocaleString('fa-IR')} کاراکتر</small></div></div>;
};
export default HtmlEditor;
