import Turndown from 'turndown';

const td = new Turndown();

export function htmlToMarkdown(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.querySelector('body');
  const bodyString = body?.innerHTML || '';
  const md = td.turndown(bodyString);
  return md;
}
