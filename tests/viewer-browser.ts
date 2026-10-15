import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1040}}),errors:string[]=[];
page.on('pageerror',e=>errors.push(e.message));await mkdir('artifacts/refinement-4',{recursive:true});
const shot=async(name:string)=>{await page.mouse.move(5,5);await page.waitForTimeout(200);return page.screenshot({path:`artifacts/refinement-4/${name}.png`,fullPage:true});};
const seek=async(n:number)=>page.locator('#scrubber').fill(String(n));
const position=async()=>Number(await page.locator('#scrubber').inputValue());
const exportApp=async()=>{await page.locator('#scenario-open').click();const promise=page.waitForEvent('download');await page.locator('#download-settings').click();const download=await promise,data=JSON.parse(await readFile((await download.path())!,'utf8'));await page.getByRole('button',{name:'Close scenario',exact:true}).click();return data;};
try{
 await page.goto(process.env.SIM_URL||'http://127.0.0.1:5174/');await page.waitForSelector('#body-svg');await page.locator('#view-tab-day').click();
 await expect(page.locator('.body-stage #view-front')).toBeVisible();await expect(page.locator('.story-panel #view-front')).toHaveCount(0);
 await expect(page.locator('#activity-caption')).toHaveText('Resting');await shot('viewer-rest');
 const stage=(await page.locator('.body-stage').boundingBox())!,body=(await page.locator('#body-svg').boundingBox())!;assert.ok(body.y-stage.y<45,'Anatomy starts near the top');
 for(const [n,caption]of [[130,'Eating breakfast'],[270,'Reading · mental work'],[610,'Running'],[640,'Strength training'],[1080,'Sleeping']] as const){await seek(n);await expect(page.locator('#activity-caption')).toHaveText(caption);await expect(page.locator('#activity-person svg')).toHaveAttribute('aria-label',caption);}
 await seek(130);await expect(page.locator('.state-panel #row-glucose')).toBeVisible();await expect(page.locator('.state-panel #row-fatShare')).toBeVisible();await expect(page.locator('.story-panel .plot-card')).toHaveCount(0);
 await seek(610);await expect(page.locator('.state-panel #plot-heart')).toBeVisible();await expect(page.locator('.state-panel #row-glucose')).toBeVisible();await shot('viewer-running');
 await page.locator('#row-fatShare').focus();await expect(page.locator('#educational-tooltip')).toContainText('model’s share');await page.keyboard.press('Escape');
 await seek(800);await expect(page.locator('#plot-meal')).toHaveClass(/is-active/);await expect(page.locator('#row-glucose')).toHaveClass(/is-focus/);
 if(await page.locator('#view-tab-day').isVisible())await page.locator('#view-tab-day').click();await page.locator('#phase-intense').click();const order=await page.locator('#physiology-plots>.plot-card').evaluateAll(es=>es.map(e=>e.id));
 await page.locator('#interval-scrubber').fill('4');await expect(page.locator('#activity-caption')).toHaveText('Sprinting');await expect(page.locator('#row-glycolytic')).toBeVisible();await shot('viewer-sprint');
 await page.locator('#interval-scrubber').fill('20');await expect(page.locator('#activity-caption')).toHaveText('Recovery walk');assert.deepEqual(await page.locator('#physiology-plots>.plot-card').evaluateAll(es=>es.map(e=>e.id)),order);
 // Daily playback stops at its own endpoint.
 if(await page.locator('#view-tab-day').isVisible())await page.locator('#view-tab-day').click();await page.locator('#phase-day').click();await seek(1439);await page.locator('#play').click();await page.waitForTimeout(300);await expect(page.locator('#phase-day')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#play')).toHaveAttribute('aria-label','Play simulation');assert.equal(await position(),1440);
 await page.locator('#back-to-long').click();await expect(page.locator('#plot-composition .plot-slider')).toBeVisible();await expect(page.locator('#activity-wrap')).toBeHidden();
 const chart=page.locator('#plot-composition .plot-slider'),svg=chart.locator('svg');
 const coord=async(day:number)=>{const b=(await svg.boundingBox())!;return {x:b.x+day/1095*b.width,y:b.y+b.height*.6};};
 let xy=await coord(225);await page.mouse.click(xy.x,xy.y);assert.ok(Math.abs(await position()-225)<.15);await expect(page.locator('#time-display')).toHaveText('Month 7.4');await expect(page.locator('#play')).toHaveAttribute('aria-label','Play simulation');
 const startMass=await page.locator('#mass-value').textContent(),startBody=await page.locator('#body-outline').getAttribute('d');
 await page.mouse.down();xy=await coord(730);await page.mouse.move(xy.x,xy.y,{steps:10});await page.mouse.up();assert.ok(Math.abs(await position()-730)<.15);assert.notEqual(await page.locator('#mass-value').textContent(),startMass);assert.notEqual(await page.locator('#body-outline').getAttribute('d'),startBody);
 await chart.focus();await page.keyboard.press('Home');assert.equal(await position(),0);await page.keyboard.press('ArrowRight');assert.equal(await position(),1);await page.keyboard.press('Shift+ArrowRight');assert.equal(await position(),31);await page.keyboard.press('PageUp');assert.equal(await position(),61);await page.keyboard.press('End');assert.equal(await position(),1095);
 for(const id of ['mass','lean','fatmass'])await expect(page.locator(`#${id}-change`)).toContainText('kg');await expect(page.locator('#bodyfat-change')).toContainText('points');await expect(chart).toHaveAttribute('aria-valuetext',/Lean mass/);
 await seek(253);await shot('viewer-long');
 await page.locator('#play').click();await page.waitForTimeout(150);assert.ok(await position()>253);xy=await coord(253.7);await page.mouse.click(xy.x,xy.y);const remembered=await position();await expect(page.locator('#play')).toHaveAttribute('aria-label','Play simulation');
 // Tuesday of a later week uses Tuesday's food and preserves exact return position.
 await page.locator('#view-tab-day').click();await expect(page.locator('#day-context-label')).toContainText('Representative Tuesday · day 254');await seek(420);await expect(page.locator('#meal-cameo svg')).toHaveAttribute('aria-label',/Rice 250 g/);await shot('viewer-representative');
 await page.locator('#back-to-long').click();assert.equal(await position(),remembered);await page.locator('#view-tab-day').click();assert.equal(await position(),420);await expect(page.locator('#day-context-label')).toContainText('Tuesday');
 // A once-only Monday meal appears on day 1 and never repeats on day 8.
 await page.locator('#diet-open').click();await page.locator('#diet-meals-view').click();await page.locator('[data-day="0"]').click();await page.locator('[data-meal="1"]').click();await page.getByRole('spinbutton',{name:'Rice grams',exact:true}).fill('400');await page.getByRole('spinbutton',{name:'Rice grams',exact:true}).press('Tab');await page.locator('#diet-scope').selectOption('day');await page.locator('#diet-run').click();
 await expect(page.locator('#day-context')).toBeHidden();await seek(420);await expect(page.locator('#meal-cameo svg')).toHaveAttribute('aria-label',/Rice 400 g/);const applied=await exportApp();
 await page.locator('#back-to-long').click();await seek(7);await page.locator('#view-tab-day').click();await seek(420);await expect(page.locator('#meal-cameo svg')).toHaveAttribute('aria-label',/Rice 300 g/);const later=await exportApp();assert.deepEqual(later.diet,applied.diet);assert.deepEqual(later.person,applied.person);
 await page.locator('#day-context-reset').click();await seek(420);await expect(page.locator('#meal-cameo svg')).toHaveAttribute('aria-label',/Rice 400 g/);
 await page.setViewportSize({width:390,height:844});await seek(0);await shot('viewer-mobile');const front=(await page.locator('#view-front').boundingBox())!,mobileStage=(await page.locator('.body-stage').boundingBox())!;assert.ok(front.x-mobileStage.x<15,'Mobile Front/Back stays at left edge');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#back-to-long').click();await chart.scrollIntoViewIfNeeded();xy=await coord(365);await page.mouse.click(xy.x,xy.y);assert.ok(Math.abs(await position()-365)<.2);await shot('viewer-mobile-chart');
 await page.setViewportSize({width:320,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Real touch input uses the same pointer-capture path; swipe remains responsive at phone width.
 const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await touch.goto(process.env.SIM_URL||'http://127.0.0.1:5174/');await touch.locator('#plot-composition .plot-slider').scrollIntoViewIfNeeded();await touch.waitForTimeout(150);
 const bounds=(await touch.locator('#plot-composition .plot-slider svg').boundingBox())!,cdp=await touch.context().newCDPSession(touch);
 const tp=(d:number)=>({x:bounds.x+d/1095*bounds.width,y:bounds.y+bounds.height*.5});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[tp(180)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[tp(365)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForTimeout(100);assert.ok(Math.abs(Number(await touch.locator('#scrubber').inputValue())-365)<2,'Touch drag seeks the shared timeline');await touch.close();
 assert.deepEqual(errors,[]);console.log('Viewer checks passed: captions, scene-aware columns, central controls, higher anatomy, separate timescales, click/drag/keyboard chart, shared playback state, exact return position, real weekday menus, one-off food isolation and mobile.');
}finally{await browser.close();}
