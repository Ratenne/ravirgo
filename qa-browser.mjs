import {existsSync} from 'node:fs';
export const browserOptions={headless:true,executablePath:process.env.CHROME_PATH||['/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync),args:['--enable-unsafe-swiftshader']};
export const baseURL=process.env.QA_URL||'http://127.0.0.1:4322/';
