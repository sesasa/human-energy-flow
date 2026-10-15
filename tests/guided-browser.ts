import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1040}}),errors:string[]=[];
page.on('pageerror',e=>errors.push(e.message));await mkdir('artifacts/guided-plots',{recursive:true});
await page.addInitScript({content:`
 window.speechLog=[];window.canceled=0;window.oldUtterance=null;
 Object.defineProperty(window,'speechSynthesis',{value:{paused:false,getVoices:()=>[],resume:()=>{},cancel:()=>{window.canceled++;},speak:u=>{window.speechLog.push(u);queueMicrotask(()=>u.onstart?.());}}});
`});
const pos=async()=>Number(await page.locator('#scrubber').inputValue());
const seek=(x:number)=>page.locator('#scrubber').fill(String(x));
const spoken=()=>page.evaluate(()=>(window as any).speechLog.map((u:any)=>u.text) as string[]);
const finish=()=>page.evaluate(()=>(window as any).speechLog.at(-1).onend());
const shot=async(name:string)=>{await page.mouse.move(5,5);await page.screenshot({path:`artifacts/guided-plots/${name}.png`,fullPage:true});};
try{
 await page.goto(process.env.SIM_URL||'http://127.0.0.1:5174/');await page.waitForSelector('#plot-composition');
 await expect(page.locator('.body-stage>.transport')).toBeVisible();await expect(page.locator('main>.transport')).toHaveCount(0);
 await expect(page.locator('.story-panel [role=meter],.story-panel .plot-card')).toHaveCount(0);
 await expect(page.locator('.system-rail [data-system]')).toHaveCount(6);
 await expect(page.locator('#plot-composition .plot-line')).toHaveCount(3);await expect(page.locator('#plot-bodyfat')).toBeVisible();await expect(page.locator('#plot-conditioning')).toBeVisible();
 await page.locator('#voice').click();assert.equal((await spoken()).length,0,'voice toggle does not speak while paused');
 await page.locator('#play').click();await expect.poll(async()=>(await spoken()).length).toBe(1);assert.match((await spoken())[0],/hours to months/);
 await page.waitForTimeout(400);assert.ok(await pos()<10,'long intro remains within its event');
 await expect(page.locator('#narration-status')).toContainText('TIMELINE PACING');
 await page.locator('#play').click();const paused=await pos(),count=(await spoken()).length;await page.waitForTimeout(150);assert.equal(await pos(),paused);assert.equal((await spoken()).length,count);
 await page.locator('#play').click();await expect.poll(async()=>(await spoken()).length).toBe(count+1);assert.equal((await spoken()).at(-1),(await spoken())[0]);
 await finish();await expect.poll(async()=>(await spoken()).length).toBe(count+2);assert.match((await spoken()).at(-1)!,/Body mass/);
 await seek(65);assert.equal((await spoken()).length,count+2);await page.locator('#play').click();await expect.poll(async()=>(await spoken()).length).toBe(count+3);assert.match((await spoken()).at(-1)!,/lean mass/);
 await page.locator('#speed').selectOption('5');await expect(page.locator('#speed')).toHaveValue('5');await expect.poll(async()=>(await spoken()).length).toBe(count+4);assert.ok(await page.evaluate(()=>(window as any).speechLog.at(-1).rate<=1.22));
 // Seeking cancels an old native utterance. A late callback cannot skip the new cue.
 await page.evaluate(()=>(window as any).oldUtterance=(window as any).speechLog.at(-1));await seek(0);
 await page.evaluate(()=>{const u=(window as any).oldUtterance;u.onend();u.onerror({error:'interrupted'});});await expect(page.locator('#voice')).toHaveAttribute('aria-pressed','true');
 await page.locator('#view-tab-day').click();await seek(155);await expect(page.locator('#physiology-plots>.plot-card')).toHaveCount(7);
 await expect(page.locator('#plot-meal .plot-unit')).toContainText('Relative index');await expect(page.locator('#plot-glycogen .plot-unit')).toHaveText('grams');
 await page.locator('#play').click();await expect.poll(async()=>(await spoken()).at(-1)).toMatch(/Insulin responds/);await expect(page.locator('#plot-meal')).toHaveClass(/is-active/);await expect(page.locator('#plot-meal .plot-line[data-series=insulin]')).toHaveClass(/is-focus/);
 await page.locator('[data-system=cardiovascular]').click();await expect(page.locator('#plot-heart')).toHaveClass(/is-active/);await expect(page.locator('#plot-meal')).toHaveClass(/is-dimmed/);await seek(165);await expect(page.locator('[data-system=cardiovascular]')).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-system=brain]').click();await expect(page.locator('#plot-caffeine')).toHaveClass(/is-active/);await expect(page.locator('#plot-sleepiness')).toHaveClass(/is-active/);await expect(page.locator('#plot-meal')).toHaveClass(/is-dimmed/);
 await page.locator('[data-system=brain]').click();await expect(page.locator('#plot-meal')).toHaveClass(/is-active/);await shot('guided-meal');
 const area=page.locator('#plot-glycogen .plot-slider'),bounds=(await area.boundingBox())!;
 await page.mouse.click(bounds.x+bounds.width*600/1440,bounds.y+bounds.height/2);assert.ok(Math.abs(await pos()-600)<.2);await expect(page.locator('#play')).toHaveAttribute('aria-label','Play simulation');
 const glucosePath=await page.locator('#plot-meal .plot-line').first().getAttribute('d');await seek(100);assert.equal(await page.locator('#plot-meal .plot-line').first().getAttribute('d'),glucosePath,'scrubbing changes the cursor, not the trace');
 await page.locator('#phase-intense').click();await expect(page.locator('#narration-guide')).toHaveAttribute('data-cue','sprint-intro');await expect(page.locator('#plot-rapid-energy .plot-cursor')).not.toHaveClass(/outside/);
 await page.locator('#go-intervals').click();await page.locator('#play').click();await expect.poll(async()=>(await spoken()).at(-1)).toMatch(/ATP demand/);
 await page.waitForTimeout(500);assert.ok((await pos()-600)*60<3,'first sprint speech stays inside the correct half of the sprint even at 5×');
 await page.locator('#interval-scrubber').fill('4');await page.locator('#play').click();await expect.poll(async()=>(await spoken()).at(-1)).toMatch(/P C R fall/);
 await expect(page.locator('#plot-rapid-energy .plot-line[data-series=pcr]')).toHaveClass(/is-focus/);
 await page.locator('#interval-scrubber').fill('20');await page.locator('#play').click();await expect.poll(async()=>(await spoken()).at(-1)).toMatch(/Aerobic metabolism/);await expect(page.locator('#glycolytic-value')).toHaveText('—');
 await page.locator('#interval-scrubber').fill('270');await expect(page.locator('#plot-power-fatigue')).toHaveClass(/is-active/);await shot('guided-sprint');
 await page.locator('#voice').click();await expect(page.locator('#narration-guide')).toBeVisible();await page.locator('#captions').click();await expect(page.locator('#narration-guide')).toBeHidden();await expect(page.locator('#speed')).toHaveValue('5');
 await page.locator('#voice').click();await expect(page.locator('#narration-guide')).toBeHidden();await page.locator('#voice').click();
 // Main-axis labels are true time ticks; destination buttons are clearly separate.
 await expect(page.locator('.jump-links')).toContainText('JUMP TO');
 await expect(page.locator('#transport-axis span')).toHaveText(['06:00','12:00','18:00','00:00','06:00']);
 // Drag through the sprint boundary without replacing the held coordinate system.
 await seek(500);const dayHeart=page.locator('#plot-heart .plot-slider'),rect=(await dayHeart.boundingBox())!;
 const xy=(minute:number)=>({x:rect.x+rect.width*minute/1440,y:rect.y+rect.height/2});
 await dayHeart.evaluate(e=>(window as any).heldPlot=e);let pt=xy(500);await page.mouse.move(pt.x,pt.y);await page.mouse.down();
 pt=xy(605);await page.mouse.move(pt.x,pt.y,{steps:10});await expect.poll(()=>pos()).toBeGreaterThan(604.8);
 assert.ok(await page.evaluate(()=>(window as any).heldPlot.isConnected));await expect(page.locator('#plot-meal')).toBeVisible();
 pt=xy(700);await page.mouse.move(pt.x,pt.y,{steps:10});await page.mouse.up();assert.ok(Math.abs(await pos()-700)<.2);
 // Keyboard traversal across the same boundary retains focus until the user leaves.
 await seek(590);await dayHeart.focus();await page.keyboard.press('ArrowRight');await expect(dayHeart).toBeFocused();await expect(page.locator('#plot-meal')).toBeVisible();
 await page.keyboard.press('ArrowRight');assert.equal(await pos(),600);await page.locator('#time-display').click();await expect(page.locator('#plot-rapid-energy')).toBeVisible();
 await page.locator('#back-to-long').click();await seek(250);await shot('guided-long');
 for(const width of [960,760,390,320]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No horizontal overflow at ${width}`);}
 await page.setViewportSize({width:390,height:844});await page.locator('#view-tab-day').click();await page.locator('#phase-day').click();await seek(130);await expect(page.locator('#mobile-follow [data-preview-plot=meal]')).toBeVisible();await page.locator('#captions').click();await expect(page.locator('#narration-guide')).toBeVisible();await expect(page.locator('#voice')).toHaveAttribute('aria-pressed','false');await shot('guided-mobile');
 assert.deepEqual(errors,[]);console.log('Guided browser passed: central controls, right-side plots, fixed scales, synchronized cues/voice/focus, pause/restart/speed/seek, stale callbacks, manual systems, stable paths, sprint pacing and responsive layouts.');
}finally{await browser.close();}
