export const normalizeMenuLink = (value: string): string => {
  const link = value.trim();
  const aliases: Record<string, string> = { '/plans': '/#plans', '/faq': '/#faq', '/contact': '/#contact' };
  return aliases[link] || (link.startsWith('#') ? `/${link}` : link);
};

export function validateMenuLink(value: string): string | null {
  const link = value.trim();
  if (!link || link.length > 200) return 'پیوند باید بین ۱ تا ۲۰۰ کاراکتر باشد.';
  if (link === '/#') return 'شناسه بخش را بعد از # وارد کنید.';
  if (/[\s\\]/u.test(link) || [...link].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) || /%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i.test(link)) return 'پیوند نباید فاصله، خط معکوس یا نویسه کنترلی داشته باشد.';
  if (link.startsWith('/page/') && !/^\/page\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(link)) return 'شناسه صفحه را کامل وارد کنید؛ مثلاً rules یا about-us.';
  if (link.startsWith('/')) return link.startsWith('//') || /^\/%2f/i.test(link) ? 'برای سایت خارجی آدرس کامل https:// وارد کنید.' : null;
  if (link.startsWith('#')) return link.length > 1 ? null : 'شناسه بخش را بعد از # وارد کنید.';
  if (/^tel:/i.test(link)) return /^tel:\+?[0-9۰-۹٠-٩()-]+$/i.test(link) ? null : 'شماره تماس معتبر وارد کنید.';
  if (/^mailto:/i.test(link)) return /^mailto:[^@\s?]+@[^@\s?]+\.[^@\s?]+$/i.test(link) ? null : 'آدرس ایمیل معتبر وارد کنید.';
  try {
    const url = new URL(link);
    if (/^https?:\/\//i.test(link) && ['http:', 'https:'].includes(url.protocol) && url.hostname && !url.username && !url.password) return null;
  } catch { /* The message below also covers incomplete URLs. */ }
  return 'پیوند باید داخلی یا از نوع https://، http://، tel: یا mailto: باشد.';
}
