import { chromium } from 'playwright';
const B='http://localhost:8000/frontend/app/', O=new URL('./assets/screens/',import.meta.url).pathname;
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:375,height:812},deviceScaleFactor:3}); const p=await ctx.newPage(); await p.clock.setFixedTime(new Date('2026-11-08T08:50:00'));
const boxes={};const shot=async(n,full=true)=>{await p.waitForTimeout(350);await p.screenshot({path:O+n+'.png',fullPage:full});
boxes[n]=await p.$$eval('button,a,h1,h2,h3,input,summary,.list-row,.tag,label,dt,dd,p',els=>els.map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName.toLowerCase(),t:(e.innerText||e.value||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,60),x:Math.round(r.left+scrollX),y:Math.round(r.top+scrollY),w:Math.round(r.width),h:Math.round(r.height)}}).filter(b=>b.w>0&&b.h>0));
console.log('==',n);};
const txt=async()=>console.log((await p.innerText('main')).replace(/\n+/g,' | ').slice(0,700));
const signIn=async(name)=>{await p.goto(B+'index.html');await p.getByText(name,{exact:true}).click();await p.locator('input').first().fill('1234');await p.getByRole('button',{name:'Sign in'}).click();await p.waitForTimeout(400);};
const STEP=process.argv[2]||'all';
await p.goto(B+'index.html'); await shot('signin',false);
await p.locator('input').first().fill('1234'); await shot('signin-pin',false);
// staff setup view of St. Jacobs
await signIn('Edward Faruzel'); await shot('staff-home-before');
await p.goto(B+'sheet.html?trip=stjacobs'); await txt(); await shot('staff-setup');
// driver
await signIn('Priya Sandhu'); await txt(); await shot('driver-home');
await p.getByRole('link',{name:/Start this trip/}).click(); await p.waitForTimeout(300); await shot('step1');
await p.locator('input').first().fill('48210'); await shot('step1-filled');
await p.getByRole('button',{name:'Continue'}).click(); await txt(); await shot('step2');
const rows=p.locator('main button.list-row[aria-pressed=false]'); const n=await rows.count(); console.log('rows',n);
for(let i=0;i<n;i++){ await p.locator('main button.list-row[aria-pressed=false]').first().click(); await p.waitForTimeout(150); if(i==1) await shot('step2-two'); }
await txt();
await shot('step2-ticked');
await p.getByRole('button',{name:/Continue|Leave the office/}).first().click(); await txt(); await shot('step3');
await p.locator('#end-time').fill('17:20'); await p.locator('main input:not([type=radio]):not([type=checkbox]):visible').first().fill('48452'); await shot('step3-filled');
await p.getByRole('button',{name:/Continue|Finish/}).first().click(); await txt(); await shot('step4');
const ins=p.locator('main input[inputmode=decimal]:visible, main input[inputmode=numeric]:visible, main input[type=text]:visible'); console.log('fuel inputs',await ins.count());
await ins.nth(0).fill('62'); await ins.nth(1).fill('98.40'); await shot('step4-filled');
await p.getByRole('button',{name:/Send|Add fuel/}).first().click(); await txt(); await shot('sent');
// staff review
await signIn('Edward Faruzel'); await txt(); await shot('staff-home-pending');
await p.goto(B+'sheet.html?trip=stjacobs'); await txt(); await shot('review');
await p.getByRole('heading',{name:'Correct a number'}).click(); await shot('review-correct');
await p.getByRole('button',{name:'Mark as checked'}).click(); await txt(); await shot('review-checked');
await p.goto(B+'home.html'); await txt(); await shot('staff-home-after');
for (const pg of ['maintenance','members','drivers']) { await p.goto(B+pg+'.html'); await shot(pg); }
await p.goto(B+'home.html'); await p.locator('summary').first().click(); await p.getByRole('button',{name:'Export trips'}).click(); await p.waitForTimeout(400); await shot('export',false);
(await import('node:fs')).writeFileSync(O+'boxes.json',JSON.stringify(boxes));
await b.close();
