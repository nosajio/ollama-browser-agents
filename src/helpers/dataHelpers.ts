import Turndown from 'turndown';

const td = new Turndown();

export function htmlToMarkdown(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = cleanNonTextContentFromHTML(doc);
  const bodyString = body?.innerHTML || '';
  const md = td.turndown(bodyString);
  return md;
}

function cleanNonTextContentFromHTML(doc: Document) {
  const nonTextContent = doc.body.querySelectorAll(
    'img, video, audio, iframe, script, canvas, svg, style, link, form',
  );
  nonTextContent.forEach((el) => {
    el.remove();
  });
  return doc.body;
}
