import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1040}}),errors:string[]=[];
page.on('pageerror',e=>errors.push(e.message));await mkdir('artifacts/status',{recursive:true});
const shot=(name:string)=>page.screenshot({path:`artifacts/status/${name}.png`,fullPage:true});
const seek=async(n:number)=>page.locator('#scrubber').fill(String(n));
const tooltip=page.locator('#educational-tooltip');
const stores=async()=>{await page.locator('#diet-open').click();await page.locator('#diet-stores-view').click();};
const exportApp=async()=>{await page.locator('#scenario-open').click();const promise=page.waitForEvent('download');await page.locator('#download-settings').click();const download=await promise,data=JSON.parse(await readFile((await download.path())!,'utf8'));await page.getByRole('button',{name:'Close scenario',exact:true}).click();return data;};
try{
 await page.goto(process.env.SIM_URL||'http://127.0.0.1:5174/');await page.waitForSelector('#body-svg');await page.locator('#view-tab-day').click();
 assert.equal(await page.locator('.body-stage #view-front').count(),1);
 await expect(page.locator('#plot-lab-ferritin')).toBeHidden();
 // Every normal activity has its own scene; activity props remain within the small frame.
 for(const [minute,activity]of [[0,'rest'],[130,'meal'],[270,'work'],[610,'run'],[640,'resistance'],[690,'recovery'],[1080,'sleep']] as const){
  await seek(minute);await expect(page.locator('#activity-person')).toHaveAttribute('data-activity',activity);
  await expect(page.locator('#activity-person svg')).toHaveAttribute('data-motion','paused');
  await page.locator('#activity-person').screenshot({path:`artifacts/status/figure-${activity}.png`});
 }
 await seek(610);await expect(page.locator('#meal-cameo')).toBeHidden();await shot('activity-run');
 const paused=await page.locator('#activity-person svg').innerHTML();await page.waitForTimeout(150);assert.equal(await page.locator('#activity-person svg').innerHTML(),paused);
 await page.locator('#play').click();await page.waitForTimeout(180);assert.notEqual(await page.locator('#activity-person svg').innerHTML(),paused);await page.locator('#play').click();
 const stopped=await page.locator('#activity-person svg').innerHTML();await page.waitForTimeout(150);assert.equal(await page.locator('#activity-person svg').innerHTML(),stopped);
 await seek(610);assert.equal(await page.locator('#activity-person svg').innerHTML(),paused,'Seeking the same instant restores the same pose');
 await page.emulateMedia({reducedMotion:'reduce'});await seek(610);await expect(page.locator('#activity-person svg')).toHaveAttribute('data-motion','reduced');
 const reduced=await page.locator('#activity-person svg').innerHTML();await page.locator('#play').click();await page.waitForTimeout(180);await page.locator('#play').click();assert.equal(await page.locator('#activity-person svg').innerHTML(),reduced);
 await page.emulateMedia({reducedMotion:'no-preference'});
 // Tooltip supports hover, focus, pin, Escape, current reading and the current situation.
 await seek(130);await page.locator('#row-glucose').hover();await expect(tooltip).toBeVisible();await expect(tooltip).toContainText('Glucose circulating');await expect(tooltip).toContainText((await page.locator('#glucose-value').textContent())!);
 await shot('glucose-tooltip');await page.keyboard.press('Escape');await expect(tooltip).toBeHidden();
 await page.locator('#row-muscle').focus();await expect(tooltip).toBeVisible();await expect(tooltip).toContainText('skeletal muscle');await page.keyboard.press('Escape');
 if(await page.locator('#view-tab-day').isVisible())await page.locator('#view-tab-day').click();await page.locator('#phase-intense').click();await page.locator('#interval-scrubber').fill('4');await expect(page.locator('#activity-person')).toHaveAttribute('data-activity','sprint');await page.locator('#row-pcr').hover();await expect(tooltip).toContainText('Phosphocreatine');await expect(tooltip).toContainText((await page.locator('#pcr-value').textContent())!);await page.keyboard.press('Escape');
 await page.locator('#interval-scrubber').fill('20');await expect(page.locator('#activity-person')).toHaveAttribute('data-activity','walk');
 await page.locator('#row-atp').focus();await expect(tooltip).toContainText('regenerate');await page.keyboard.press('Escape');
 await page.locator('#back-to-long').click();await expect(page.locator('#activity-person')).toBeHidden();
 for(const id of ['lean','mass','fatmass'])await expect(page.locator(`#${id}-change`)).toContainText('+0.0 kg');
 await seek(365);for(const id of ['lean','mass','fatmass'])await expect(page.locator(`#${id}-change`)).toContainText('kg');await expect(page.locator('#bodyfat-value')).toContainText('%');
 // Selected lab observations share the long timeline; food inputs never overwrite measured starts.
 await stores();
 for(const [marker,name,value]of [['ferritin','Ferritin','10'],['b12','Serum vitamin B12','185'],['vitd','25-OH vitamin D','38'],['folate','Serum folate','6']]){await page.locator(`[data-select-marker="${marker}"]`).check();const input=page.getByRole('spinbutton',{name:`${name} result`,exact:true});await input.fill(value);await input.press('Tab');}
 await page.locator('#diet-run').click();
 for(const [key,value]of [['ferritin','10 µg/L'],['b12','185 pmol/L'],['vitd','38 nmol/L'],['folate','6 nmol/L']])await expect(page.locator(`#${key}-value`)).toHaveText(value);
 await seek(1);await expect(page.locator('#ferritin-note')).toContainText('Estimate');await seek(182);await expect(page.locator('#ferritin-value')).not.toHaveText('10 µg/L');await shot('labs-main-year');await expect(page.locator('[data-plot^=lab-]')).toHaveCount(4);
 await page.locator('#row-ferritin').click();await expect(tooltip).toBeVisible();await page.keyboard.press('Escape');
 const data=await exportApp();assert.equal(data.diet.micronutrients.observations.ferritin.value,10);assert.deepEqual(data.micronutrientDraft.selected,['ferritin','b12','folate','vitd']);
 await seek(0);if(await page.locator('#view-tab-day').isVisible())await page.locator('#view-tab-day').click();await page.locator('#phase-day').click();await seek(130);await expect(page.locator('[data-plot^=lab-]')).toHaveCount(0);await expect(page.locator('#stores-watch-open')).toBeVisible();await seek(800);await expect(page.locator('[data-plot^=lab-]')).toHaveCount(0);await expect(page.locator('#stores-watch-open')).toBeVisible();
 await stores();await page.locator('#diet-meals-view').click();await page.locator('.diet-coverage summary').click();await page.locator('[data-tip="intake-iron_mg"]').focus();await expect(tooltip).toContainText('dietary intake');await expect(tooltip).toContainText('separate Micronutrients');await page.keyboard.press('Escape');await page.locator('#diet-close').click();
 await page.setViewportSize({width:390,height:844});await shot('activity-mobile');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('Status browser checks passed: seven activity scenes, sprint/walk, deterministic scrub/pause/reduced motion, hover/focus/pinned tooltips, absolute mass changes, selected laboratory day/year integration, export and mobile.');
}finally{await browser.close();}
