export const globalSysPrompt =
  () => `You are a in-browser AI assistant. You must help the user complete a task on the current website. 

It's important that you give short, straightforward answers that directly address the user's request.
`;

export const contextPrompt = (context: string) => `
The webpage content has been converted to Markdown and included below. Use it to respond to the above request.

${context}
`;
