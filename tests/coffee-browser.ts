import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors:string[]=[];
page.on('pageerror',e=>errors.push(e.message));await mkdir('artifacts/caffeine',{recursive:true});
await page.addInitScript({content:`Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{},resume:()=>{},speak:u=>{window.lastSpeech=u.text;queueMicrotask(()=>u.onstart?.());}}});`});
const seek=(x:number)=>page.locator('#scrubber').fill(String(x));
const mg=async()=>parseFloat(await page.locator('#caffeine-value').innerText());
const snapshot=async(name:string)=>{await page.mouse.move(5,5);await page.screenshot({path:`artifacts/caffeine/${name}.png`,fullPage:true});};
try{
 await page.goto(process.env.SIM_URL||'http://127.0.0.1:5174/');await page.waitForSelector('#body-svg');
 await expect(page.locator('#coffee-controls')).toBeHidden();await expect(page.locator('#plot-caffeine')).toHaveCount(0);
 await expect(page.locator('#inside-day,[data-system=guided]')).toHaveCount(0);
 await page.locator('#view-tab-day').click();await expect(page.locator('#coffee-time')).toHaveValue('210');
 await expect(page.locator('#coffee-dose')).toHaveValue('90');await expect(page.locator('#coffee-duration')).toContainText('5');
 await page.locator('#coffee-jump').click();await expect(page.locator('#time-display')).toHaveText('09:30');await expect(page.locator('#activity-caption')).toHaveText('Drinking coffee');
 await expect(page.locator('#activity-person')).toHaveAttribute('data-activity','coffee');await expect(page.locator('[data-prop=coffee-cup]')).toBeVisible();await snapshot('coffee-break');
 await page.locator('#voice').click();await page.locator('#play').click();await expect.poll(()=>page.evaluate(()=>(window as any).lastSpeech)).toMatch(/90 milligrams/);
 await expect(page.locator('#plot-caffeine')).toHaveClass(/is-active/);await expect(page.locator('#narration-guide')).toHaveAttribute('data-cue','coffee-drink');
 await page.locator('#speed').selectOption('2');await page.locator('#play').click();
 const cupPose=await page.locator('[data-prop=coffee-cup]').getAttribute('transform');await page.waitForTimeout(150);assert.equal(await page.locator('[data-prop=coffee-cup]').getAttribute('transform'),cupPose);
 await seek(230);await page.locator('#play').click();await expect.poll(()=>page.evaluate(()=>(window as any).lastSpeech)).toMatch(/adenosine receptors/);await page.locator('#play').click();await page.locator('#voice').click();
 await seek(265);const morning=await mg();assert.ok(morning>60&&morning<90);
 const read=()=>page.locator('#glucose-value,#insulin-value,#muscle-value,#hr-value,#intake-value').allTextContents();
 const otherValues=await read(),body=await page.locator('#body-outline').getAttribute('d');
 await page.locator('#coffee-enabled').uncheck();assert.equal(await mg(),0);assert.deepEqual(await read(),otherValues);assert.equal(await page.locator('#scrubber').inputValue(),'265');assert.equal(await page.locator('#body-outline').getAttribute('d'),body);
 assert.equal(await page.locator('#sleepPressure-value').innerText(),await page.locator('#sleepiness-value').innerText());await expect(page.locator('#coffee-legend')).toBeHidden();
 await page.locator('#coffee-enabled').check();await page.locator('#coffee-dose').selectOption('180');assert.ok(Math.abs(await mg()-morning*2)<=1);
 await page.locator('#coffee-dose').selectOption('90');await snapshot('coffee-brain');
 await page.locator('#row-caffeine').focus();await expect(page.locator('#educational-tooltip')).toContainText('not a blood concentration');await page.keyboard.press('Escape');
 await seek(960);const morningBedtime=await mg();await page.locator('#coffee-time').selectOption('840');assert.ok(await mg()>morningBedtime*3);await expect(page.locator('#time-display')).toHaveText('22:00');
 await expect(page.locator('#sleepiness-value')).toHaveText('Asleep');await expect(page.locator('#coffee-duration')).toContainText('22:00');await snapshot('coffee-evening-residual');
 // Plot interaction and playback use one clock.
 const plot=page.locator('#plot-caffeine .plot-slider');await plot.focus();await page.keyboard.press('Home');await expect(page.locator('#scrubber')).toHaveValue('0');
 await page.keyboard.press('ArrowRight');await expect(page.locator('#scrubber')).toHaveValue('5');
 const box=(await plot.locator('svg').boundingBox())!;await page.mouse.click(box.x+box.width*850/1440,box.y+box.height/2);assert.ok(Math.abs(Number(await page.locator('#scrubber').inputValue())-850)<1);
 await page.locator('#scenario-open').click();const download=page.waitForEvent('download');await page.locator('#download-settings').click();const file=await download,data=JSON.parse(await readFile((await file.path())!,'utf8'));
 assert.deepEqual(data.dailyCoffee,{enabled:true,minute:840,doseMg:90,clock:'20:00'});await page.getByRole('button',{name:'Close scenario',exact:true}).click();
 // Meal illustrations and their explanations survive nearby or simultaneous cups.
 await page.locator('#coffee-time').selectOption('120');await seek(125);await expect(page.locator('#meal-cameo')).toBeVisible();await expect(page.locator('#coffee-cameo')).toBeHidden();await expect(page.locator('#activity-caption')).toHaveText('Drinking coffee');
 await page.locator('#coffee-time').selectOption('180');await seek(195);await expect(page.locator('#narration-guide')).toHaveAttribute('data-cue','meal-0-storage');
 await page.locator('#coffee-time').selectOption('60');await seek(75);await expect(page.locator('#narration-guide')).toHaveAttribute('data-cue','mental-work');
 await page.locator('#coffee-time').selectOption('240');await seek(255);await expect(page.locator('#narration-guide')).toHaveAttribute('data-cue','coffee-brain');
 await seek(420);await expect(page.locator('#meal-cameo')).toContainText('Lunch');await expect(page.locator('#coffee-cameo')).toBeHidden();await expect(page.locator('#narration-guide')).toHaveAttribute('data-cue','meal-1-plate');await snapshot('coffee-lunch-preserved');
 await seek(520);await expect(page.locator('#scene-title')).toContainText('fades');await expect(page.locator('#narration-guide')).toHaveAttribute('data-cue','coffee-clearing');
 await page.locator('#phase-intense').click();await expect(page.locator('#coffee-controls')).toBeHidden();await expect(page.locator('#plot-caffeine')).toHaveCount(0);await expect(page.locator('#caffeine-signals')).toHaveAttribute('opacity','0');
 await page.locator('#view-back').click();assert.equal(await page.locator('#caffeine-signals').evaluate(e=>getComputedStyle(e).opacity),'0');await page.locator('#view-front').click();
 await page.locator('#back-to-long').click();await expect(page.locator('#coffee-controls')).toBeHidden();await expect(page.locator('#plot-caffeine')).toHaveCount(0);
 await page.locator('#view-tab-day').click();await page.locator('#phase-day').click();await page.locator('#coffee-time').selectOption('210');
 for(const width of [960,390,320]){await page.setViewportSize({width,height:1000});await seek(230);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await snapshot(`coffee-${width}`);}
 await page.emulateMedia({reducedMotion:'reduce'});await seek(212);await expect(page.locator('#activity-person svg')).toHaveAttribute('data-motion','reduced');await expect(page.locator('[data-prop=coffee-cup]')).toBeVisible();
 const reduced=await page.locator('[data-prop=coffee-cup]').getAttribute('transform');await page.locator('#play').click();await page.waitForTimeout(180);assert.equal(await page.locator('[data-prop=coffee-cup]').getAttribute('transform'),reduced);await page.locator('#play').click();
 assert.deepEqual(errors,[]);console.log('Coffee browser passed: timed sipping, dose/time/skip, shared scrubbing, narration and speed, bedtime residual, model isolation, export, tooltips, mobile and reduced motion.');
}finally{await browser.close();}
