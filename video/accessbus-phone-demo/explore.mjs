import { chromium } from 'playwright';
const B='http://localhost:8000/frontend/app/';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:375,height:812},deviceScaleFactor:3}); const p=await ctx.newPage();
await p.goto(B+'index.html');
await p.getByText('Edward Faruzel').click(); await p.locator('input').first().fill('1234'); await p.getByRole('button',{name:'Sign in'}).click();
await p.waitForTimeout(500);
console.log('URL',p.url()); console.log((await p.innerText('main')).slice(0,1500));
console.log('LINKS',await p.$$eval('a,button',e=>e.map(x=>(x.innerText||'').trim().replace(/\s+/g,' ')+' -> '+(x.getAttribute('href')||'')).filter(Boolean).join('\n')));
await b.close();
