# LLM Agents Chrome Extension

### Development

👇 Install dependencies.
```bash
pnpm install
```

👇 Start the dev server
```bash
pnpm dev
```

👇 Load extension in Chrome developer mode
1. Go to `chrome://extensions`
2. Activate developer mode
3. click 'Load unpacked', and select `llm-agents/build` folder

### Nomal FrontEnd Developer Mode
1. access `http://0.0.0.0:3000/`
2. when debugging popup page, open `http://0.0.0.0:3000/popup.html`
3. when debugging options page, open `http://0.0.0.0:3000/options.html`

## Build package

After the development of your extension run the command

```shell
$ npm run build
```