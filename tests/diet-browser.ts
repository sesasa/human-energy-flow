import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1040}}),errors:string[]=[];
page.on('pageerror',e=>errors.push(e.message));await mkdir('artifacts/diet',{recursive:true});
const shot=(name:string)=>page.screenshot({path:`artifacts/diet/${name}.png`,fullPage:true});
const n=async(id:string)=>Number((await page.locator(id).textContent())!.replace(/[^\d.]/g,''));
const exportApp=async()=>{await page.locator('#scenario-open').click();const promise=page.waitForEvent('download');await page.locator('#download-settings').click();const download=await promise,data=JSON.parse(await readFile((await download.path())!,'utf8'));await page.getByRole('button',{name:'Close scenario',exact:true}).click();return data;};
await page.goto(process.env.SIM_URL||'http://127.0.0.1:5174/');await page.waitForSelector('#body-svg');await page.locator('#view-tab-day').click();
await expect(page.locator('.starting-body')).toHaveCount(0);await expect(page.locator('#active-diet')).toHaveText('Monday · Healthy · reference week');
await page.locator('#scenario-open').click();await expect(page.locator('#scenario-dialog [data-body-preset="baseline"]')).toBeVisible();await expect(page.locator('#input-protein')).toHaveCount(0);await page.locator('[data-body-preset="overweight"]').click();await expect(page.locator('#input-weight')).toHaveValue('88');await expect(page.locator('#form-body-preview')).toContainText('61.6');await page.getByRole('button',{name:'Close scenario',exact:true}).click();await expect(page.locator('#person-label')).toContainText('75 kg');
await page.locator('#diet-open').click();await expect(page.locator('#diet-dialog')).toBeVisible();await expect(page.locator('#diet-days [role="tab"]')).toHaveCount(7);await expect(page.locator('#diet-meals [role="tab"]')).toHaveCount(4);
await shot('diet-breakfast');await page.locator('[data-meal="1"]').click();await expect(page.locator('#diet-plate svg')).toHaveAttribute('aria-label',/Rice 300 g/);await shot('diet-lunch');
// The desktop footer must not obscure a focused bottom ingredient or add-food control.
for(const target of [page.getByRole('spinbutton',{name:'Salt grams',exact:true}),page.locator('#diet-add-food')]){
 await target.focus();await page.waitForTimeout(50);
 const bounds=await target.boundingBox(),footer=await page.locator('.diet-apply').boundingBox();
 assert.ok(bounds&&footer&&bounds.y+bounds.height<=footer.y+2,'Focused food control must stay above sticky Run bar');
}
await page.locator('#diet-add-food').selectOption('tomato');await expect(page.getByRole('spinbutton',{name:'Tomatoes grams',exact:true})).toBeFocused();
await page.locator('#diet-revert-day').click();

const before=await page.locator('#diet-plate').innerHTML(),beforeTotals=await page.locator('#diet-totals').textContent();
await page.getByRole('button',{name:'More Rice',exact:true}).click();await expect(page.getByRole('spinbutton',{name:'Rice grams',exact:true})).toHaveValue('350');assert.notEqual(await page.locator('#diet-plate').innerHTML(),before);assert.notEqual(await page.locator('#diet-totals').textContent(),beforeTotals);await expect(page.locator('#diet-draft-state')).toContainText('not applied');
await page.locator('[data-day="1"]').click();await expect(page.getByRole('spinbutton',{name:'Rice grams',exact:true})).toHaveValue('250');
await page.locator('[data-day="0"]').click();await expect(page.getByRole('spinbutton',{name:'Rice grams',exact:true})).toHaveValue('350');
await page.locator('#diet-close').click();await expect(page.locator('#diet-open')).toContainText('draft');await expect(page.locator('#intake-value')).toHaveText('2,603');
await page.locator('#diet-open').click();await page.getByRole('spinbutton',{name:'Rice grams',exact:true}).fill('400');await page.getByRole('spinbutton',{name:'Rice grams',exact:true}).press('Tab');
await page.locator('#diet-run').click();await expect(page.locator('#diet-dialog')).toBeHidden();await expect(page.locator('#active-diet')).toHaveText('Monday · Healthy · edited week');assert.ok(await n('#intake-value')>2700);
await page.getByRole('button',{name:'Lunch',exact:true}).click();await expect(page.locator('#meal-cameo')).toBeVisible();await expect(page.locator('#meal-cameo svg')).toHaveAttribute('aria-label',/Rice 400 g/);await shot('meal-in-body');
await page.locator('#scrubber').fill('450');await expect(page.locator('#meal-cameo')).toHaveClass(/absorbing/);await expect(page.locator('#scene-title')).toContainText('circulation');
const applied=await exportApp();assert.equal(applied.diet.week[0].meals[1].foods.find((p:any)=>p.foodId==='rice').grams,400);assert.equal(applied.diet.week[1].meals[1].foods.find((p:any)=>p.foodId==='rice').grams,250);
// Edit two days, apply only Tuesday once. Other draft edit must stay unapplied.
await page.locator('#diet-open').click();await page.locator('[data-day="0"]').click();await page.getByRole('button',{name:'More Rice',exact:true}).click();await page.locator('[data-day="1"]').click();await page.getByRole('button',{name:'More Rice',exact:true}).click();await page.locator('#diet-scope').selectOption('day');await expect(page.locator('#diet-scope-note')).toContainText('Other edited days remain drafts');await page.locator('#diet-run').click();await expect(page.locator('#active-diet')).toHaveText('Tuesday · Healthy · this day only');
const once=await exportApp();assert.equal(once.diet.once.name,'Tuesday');assert.equal(once.diet.week[0].meals[1].foods.find((p:any)=>p.foodId==='rice').grams,400);assert.equal(once.dietDraft[0].meals[1].foods.find((p:any)=>p.foodId==='rice').grams,450);assert.equal(once.diet.week[1].meals[1].foods.find((p:any)=>p.foodId==='rice').grams,250);assert.equal(once.diet.once.meals[1].foods.find((p:any)=>p.foodId==='rice').grams,300);
await page.locator('#back-to-long').click();await page.getByRole('button',{name:'Year 1',exact:true}).click();assert.ok(await n('#mass-value')>0);await shot('diet-year');
await page.locator('#diet-open').click();await page.locator('#diet-reset').click();await expect(page.locator('#active-diet')).toHaveText('Tuesday · Healthy · reference week');
// Native dialog, keyboard day navigation and zero portions.
await page.locator('#diet-open').click();await page.locator('#diet-day-1').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#diet-day-2')).toBeFocused();await expect(page.locator('#diet-day-title')).toHaveText('Wednesday');
await page.locator('[data-day="0"]').click();await page.locator('[data-meal="1"]').click();const rice=page.getByRole('spinbutton',{name:'Rice grams',exact:true});await rice.fill('0');await rice.press('Tab');await expect(page.locator('#diet-plate svg')).not.toHaveAttribute('aria-label',/Rice/);await expect(page.getByRole('button',{name:'Less Rice',exact:true})).toBeDisabled();
await page.locator('#diet-revert-day').click();await expect(rice).toHaveValue('300');
await page.getByRole('button',{name:'More Rice',exact:true}).click();await page.locator('#diet-discard').click();await expect(page.locator('#diet-day-title')).toHaveText('Tuesday');await expect(rice).toHaveValue('250');await expect(page.locator('#diet-discard')).toBeDisabled();await page.locator('[data-day="0"]').click();
await page.locator('#diet-meal-1').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#diet-meal-3')).toBeFocused();await page.keyboard.press('ArrowRight');await expect(page.locator('#diet-meal-2')).toBeFocused();await page.locator('#diet-meal-1').click();
await page.locator('.diet-coverage summary').click();await expect(page.locator('#diet-micros')).toContainText('Vitamin D');await expect(page.locator('#diet-micros')).toContainText('Incomplete data');await shot('diet-coverage');
// Sunday does not disable the underlying weekly resistance routine.
await page.locator('[data-day="6"]').click();await page.locator('#diet-scope').selectOption('week');await page.locator('#diet-run').click();await page.locator('#diet-open').click();await page.locator('[data-day="0"]').click();await page.locator('#diet-run').click();if(await page.locator('#view-tab-day').isVisible())await page.locator('#view-tab-day').click();await page.locator('#phase-day').click();await page.locator('#scrubber').fill('640');await expect(page.locator('#activity-tag')).toHaveText('RESISTANCE');
await page.setViewportSize({width:390,height:844});await page.locator('#diet-open').click();await page.locator('.diet-coverage summary').click();await page.locator('#diet-dialog').evaluate(e=>e.scrollTop=0);await shot('diet-mobile');
assert.ok(await page.locator('#diet-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),'Diet must not overflow horizontally');
await page.getByRole('button',{name:'More Rice',exact:true}).click();await expect(page.getByRole('spinbutton',{name:'Rice grams',exact:true})).toHaveValue('350');await page.locator('#diet-run').scrollIntoViewIfNeeded();await shot('diet-mobile-controls');await page.locator('#diet-run').click();assert.ok(await n('#intake-value')>2650);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
if(await page.locator('#view-tab-day').isVisible())await page.locator('#view-tab-day').click();await page.locator('#phase-intense').click();await page.locator('#interval-scrubber').fill('689');await expect(page.locator('#rep-counter')).toHaveText('REP 20 / 20');assert.ok(await n('#atp-value')>85);
assert.deepEqual(errors,[]);await browser.close();console.log('Diet browser checks passed: scenario placement, seven days, food portions and SVG response, independent drafts, repeat/once scopes, JSON export, meal storytelling, reset, keyboard tabs, zero food, micronutrients, Sunday alignment, mobile and sprint compatibility.');
