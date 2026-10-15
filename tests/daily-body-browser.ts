import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1040}}),errors:string[]=[];
page.on('pageerror',e=>errors.push(e.message));await mkdir('artifacts/daily-body',{recursive:true});
const seek=(n:number)=>page.locator('#scrubber').fill(String(n));
const shape=()=>page.locator('#body-svg').evaluate(e=>({outline:e.querySelector('#body-outline')!.getAttribute('d'),fat:e.getAttribute('data-fat-fraction'),lean:e.getAttribute('data-lean-width'),muscle:(e.querySelector('[data-muscle="quadriceps"]') as SVGElement).style.transform}));
const shot=async(name:string)=>{await page.mouse.move(5,5);await page.waitForTimeout(300);await page.screenshot({path:`artifacts/daily-body/${name}.png`,fullPage:true});};
const exportApp=async()=>{await page.locator('#scenario-open').click();const download=page.waitForEvent('download');await page.locator('#download-settings').click();const file=await download,data=JSON.parse(await readFile((await file.path())!,'utf8'));await page.getByRole('button',{name:'Close scenario',exact:true}).click();return data;};
try{
 await page.goto(process.env.SIM_URL||'http://127.0.0.1:5174/');await page.waitForSelector('#body-svg');
 const original=(await exportApp()).person;
 for(const template of ['fast-food','low-variety']){
  await page.locator('#diet-open').click();await page.locator(`input[name="diet-template"][value="${template}"]`).check();await page.locator('#diet-run').click();
  const initial=await shape();
  await page.locator('#view-tab-day').click();const figureStart=await page.locator('#activity-person svg').innerHTML();await page.locator('#back-to-long').click();
  await seek(91.4);const evolved=await shape(),mass=(await page.locator('#mass-value').innerText()).replace('~',''),fat=await page.locator('#bodyfat-value').innerText();
  assert.notDeepEqual(evolved,initial);await shot(`${template}-over-time`);
  await page.locator('#view-tab-day').click();assert.deepEqual(await shape(),evolved,'Daily anatomy retains the exact long-view body and muscle shape');
  await expect(page.locator('#day-context-body')).toContainText(mass);await expect(page.locator('#day-context-body')).toContainText(fat);assert.notEqual(await page.locator('#activity-person svg').innerHTML(),figureStart,'Small character also receives adapted proportions');
  const resting=parseFloat(await page.locator('#hr-value').innerText());
  for(const minute of [130,420,610,800,1080]){await seek(minute);assert.deepEqual(await shape(),evolved,'Meal/run/sleep must not transform body composition within hours');if(minute===610)assert.ok(parseFloat(await page.locator('#hr-value').innerText())>resting+30);}
  await seek(610);await shot(`${template}-daily-body`);await page.locator('#view-back').click();await expect(page.locator('#body-svg')).toHaveClass(/posterior/);assert.deepEqual(await shape(),evolved);await page.locator('#view-front').click();
  await page.locator('#phase-intense').click();await page.locator('#interval-scrubber').fill('4');assert.deepEqual(await shape(),evolved);
  const hr=parseFloat(await page.locator('#hr-value').innerText()),pulse=await page.locator('#body-svg').evaluate(e=>parseFloat((e as SVGElement).style.getPropertyValue('--pulse-speed')));assert.ok(hr>resting+20);assert.ok(Math.abs(60/pulse-hr)<1,'Anatomy heartbeat still follows live sprint HR');
  await shot(`${template}-sprint-body`);
  await page.locator('#back-to-long').click();await expect(page.locator('#scrubber')).toHaveValue('91.4');await page.locator('#view-tab-day').click();await expect(page.locator('#phase-intense')).toHaveAttribute('aria-pressed','true');assert.deepEqual(await shape(),evolved);
  assert.deepEqual((await exportApp()).person,original,'Inspecting a later body leaves the base profile unchanged');
  await page.locator('#day-context-reset').click();assert.deepEqual(await shape(),initial);await page.locator('#back-to-long').click();
 }
 // Female contour and scope-limited composition use the same context path.
 await page.locator('#view-tab-day').click();await expect(page.locator('#day-context')).toBeVisible();
 await page.locator('#scenario-open').click();await page.locator('#sex-female').check();await page.locator('#scenario-form button[type="submit"]').click();await expect(page.locator('#day-context')).toBeHidden();await expect(page.locator('#scrubber')).toHaveValue('0');
 await page.locator('#back-to-long').click();await seek(365);
 const female=await shape();await page.locator('#view-tab-day').click();assert.deepEqual(await shape(),female);await expect(page.locator('#body-svg')).toHaveAttribute('data-sex','female');
 await page.locator('#phase-intense').click();await page.locator('#interval-scrubber').fill('4');assert.deepEqual(await shape(),female);
 const tooltip=page.locator('#educational-tooltip'),atp=page.locator('#row-atp');
 // A stationary pointer must not open a tooltip when live curves and legends update.
 await page.locator('#interval-scrubber').fill('4');await page.locator('#row-atp').scrollIntoViewIfNeeded();
 const pcr=(await page.locator('#row-pcr').boundingBox())!,point={x:pcr.x+pcr.width/2,y:pcr.y+pcr.height/2};
 await page.mouse.move(point.x,point.y);await page.waitForTimeout(300);await page.keyboard.press('Escape');
 await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();});
 await page.locator('#play').evaluate((e:HTMLElement)=>e.click());await page.waitForTimeout(450);await expect(tooltip).toBeHidden();
 await atp.hover();await expect(tooltip).toBeVisible();await expect(tooltip).toContainText('immediate energy carrier');
 await page.keyboard.press('Escape');await expect(tooltip).toBeHidden();await page.waitForTimeout(850);await expect(tooltip).toBeHidden();
 await page.locator('#play').click();await atp.focus();await expect(tooltip).toBeVisible();await expect(tooltip).toContainText('ATP is continually regenerated');
 await page.keyboard.press('Escape');await atp.click();await expect(tooltip).toBeVisible();
 await page.locator('#phase-day').click();await expect(tooltip).toBeHidden();
 await page.locator('#phase-intense').click();await atp.click();await expect(tooltip).toBeVisible();await page.locator('#play').click();await expect(tooltip).toBeHidden();await page.locator('#play').click();
 // Deliberate hover is readable beside the row, never covering the ATP bar.
 await atp.hover();await expect(tooltip).toBeVisible();const a=(await atp.boundingBox())!,t=(await tooltip.boundingBox())!;assert.ok(t.x+t.width<=a.x||t.x>=a.x+a.width||t.y+t.height<=a.y||t.y>=a.y+a.height);await shot('tooltip-intentional');
 await page.locator('#phase-day').click();await page.setViewportSize({width:390,height:844});await seek(130);await shot('daily-body-mobile');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.setViewportSize({width:320,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await touch.goto(process.env.SIM_URL||'http://127.0.0.1:5174/');await touch.locator('#view-tab-day').tap();await touch.locator('#phase-intense').tap();await touch.locator('#row-atp').tap();await expect(touch.locator('#educational-tooltip')).toBeVisible();await touch.locator('#row-atp').tap();await expect(touch.locator('#educational-tooltip')).toBeHidden();await touch.close();
 assert.deepEqual(errors,[]);console.log('Daily body browser checks passed: diet-derived anatomy, fractional time, male/female, both daily modes, stable within-day shape, live HR, baseline reset, unchanged profile, intentional tooltips, mobile and touch.');
}finally{await browser.close();}
