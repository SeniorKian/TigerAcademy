import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import { Container, Skeleton } from '@/design-system';
import PublicLayout from './PublicLayout';

interface ContentBlock { id: number; key: string; value: string; type: number; order: number; }
const cleanHtml = (value: string) => { const documentFragment = new DOMParser().parseFromString(value, 'text/html'); documentFragment.querySelectorAll('script,style,iframe,object,embed,form').forEach(node => node.remove()); documentFragment.body.querySelectorAll('*').forEach(node => Array.from(node.attributes).forEach(attribute => { if (attribute.name.startsWith('on') || /javascript:/i.test(attribute.value)) node.removeAttribute(attribute.name); })); return documentFragment.body.innerHTML; };

const DynamicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>(); const [blocks, setBlocks] = useState<ContentBlock[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; apiClient.get<ContentBlock[]>(`/content/${encodeURIComponent(slug || '')}?language=fa`).then(response => { if (active) setBlocks(response.data); }).catch(() => undefined).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [slug]);
  return <PublicLayout><section className="py-12 sm:py-16 min-h-[55vh] bg-slate-50"><Container size="lg">{loading ? <Skeleton className="h-72 rounded-2xl" /> : blocks.length === 0 ? <div className="card text-center py-16"><h1 className="text-2xl font-black">این صفحه هنوز محتوا ندارد</h1><p className="text-slate-500 mt-3">ابتدا در مدیریت محتوا، صفحه‌ای با کلید «{slug}» بسازید.</p></div> : <div className="space-y-6">{blocks.map((block, index) => <article key={block.id} className="card public-content-block">{block.type === 0 && (index === 0 ? <h1 className="text-2xl sm:text-3xl font-black leading-relaxed">{block.value}</h1> : <p className="whitespace-pre-line leading-9">{block.value}</p>)}{(block.type === 1 || block.type === 4) && <img src={block.value} alt={block.key} className="w-full max-h-[520px] object-cover rounded-xl" />}{block.type === 2 && <video src={block.value} controls className="w-full rounded-xl bg-black" />}{block.type === 3 && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: cleanHtml(block.value) }} />}{block.type === 5 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{block.value.split(/\r?\n/).filter(Boolean).map(url => <img key={url} src={url} alt="" className="w-full h-64 object-cover rounded-xl" />)}</div>}</article>)}</div>}</Container></section></PublicLayout>;
};
export default DynamicPage;
