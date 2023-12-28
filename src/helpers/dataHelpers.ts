import { marked } from 'marked';
import Turndown from 'turndown';
import { BaseAgent } from '../types/schema';

const td = new Turndown();

export async function markdownToHtml(markdown: string) {
  const html = await marked.parse(markdown);
  return html;
}

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

export function assertBaseAgent(agent: BaseAgent | null): asserts agent is BaseAgent {
  if (!agent) throw new Error('Agent not found');
  if (!('name' in agent)) throw new Error('Agent missing name');
  if (!('sysPrompt' in agent)) throw new Error('Agent missing sysPrompt');
  if (!('color' in agent)) throw new Error('Agent missing color');
}

export function assertBaseAgentArray(agents: BaseAgent[]): asserts agents is BaseAgent[] {
  if (!Array.isArray(agents)) throw new Error('Agents not found');
  agents.forEach((agent) => {
    assertBaseAgent(agent);
  });
}

export function randomColor() {
  const colors = ['blue', 'green', 'red', 'purple', 'yellow'] as const;
  const i = Math.floor(Math.random() * colors.length);
  return colors[i];
}
