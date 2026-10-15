// Original SVG artwork. Anatomical placement follows OpenStax references in revision-2/SOURCES.md.
export const outline = `M310 35 C287 34 278 50 279 71 L280 87 Q282 105 293 111 L292 133
C280 144 261 147 248 150 C228 149 214 157 208 173 C201 190 202 205 195 226
L182 269 Q173 284 170 305 L155 357 L151 371 Q145 377 143 386 L140 401 Q140 406 144 404 L150 391
L149 415 Q150 420 153 416 L157 395 L157 420 Q159 424 162 418 L165 395 L166 416 Q169 420 171 413 L173 392 L176 407 Q180 410 181 404 L180 380
Q178 371 176 365 L191 328 Q204 307 209 284 L222 247 L232 215
Q233 248 239 267 Q246 289 240 321 L236 350 C233 368 235 391 241 407
L240 448 Q237 472 242 497 Q248 514 245 537 C239 560 239 583 244 603 L246 636
Q245 645 236 654 L226 665 Q225 673 235 675 L270 675 Q279 672 276 663 L269 651 L272 623
Q282 585 282 555 L285 519 Q293 498 293 475 L302 415 Q306 398 310 396
Q314 398 318 415 L327 475 Q327 498 335 519 L338 555 Q338 585 348 623 L351 651 L344 663 Q341 672 350 675 L385 675 Q395 673 394 665 L384 654 Q375 645 374 636 L376 603 C381 583 381 560 375 537 Q372 514 378 497 Q383 472 380 448 L379 407 C385 391 387 368 384 350 L380 321 Q374 289 381 267 Q387 248 388 215 L398 247 L411 284 Q416 307 429 328 L444 365 Q442 371 440 380 L439 404 Q440 410 444 407 L447 392 L449 413 Q451 420 454 416 L455 395 L458 418 Q461 424 463 420 L463 395 L467 416 Q470 420 471 415 L470 391 L476 404 Q480 406 480 401 L477 386 Q475 377 469 371 L465 357 L450 305 Q447 284 438 269 L425 226 C418 205 419 190 412 173 C406 157 392 149 372 150 C359 147 340 144 328 133 L327 111 Q338 105 340 87 L341 71 C342 50 333 34 310 35 Z`;
export interface Muscle {name:string;path:string;fibers?:string;}
export const frontMuscles:Muscle[]=[
{name:'neck',path:'M294 117Q292 138 276 148L301 154L305 146Z',fibers:'M296 126L296 143L283 149'},
{name:'shoulders',path:'M249 154C225 151 215 164 214 185L224 211Q230 203 235 185Q242 167 258 164Z',fibers:'M244 158Q226 169 221 199M249 160Q234 172 227 193'},
{name:'chest',path:'M265 165Q285 160 306 166L306 199Q290 218 253 204L236 184Q245 173 265 165Z',fibers:'M302 171L244 182M302 179L248 188M302 187L254 195M300 195L264 201'},
{name:'biceps',path:'M218 215Q202 230 197 253Q193 266 201 276Q214 263 222 242Q225 226 218 215Z',fibers:'M215 224Q207 249 201 267M219 230L207 257'},
{name:'triceps',path:'M228 205Q233 222 224 250L211 274Q217 248 218 234Z'},
{name:'forearms',path:'M196 284Q182 292 179 314L162 360L171 365Q188 340 195 320Q204 296 196 284Z',fibers:'M192 293L168 357M195 304L173 351M185 306L165 351'},
{name:'core',path:'M285 215Q295 211 306 215L306 320L294 339L280 315Q278 278 285 215Z',fibers:'M284 239Q294 243 306 239M282 263Q294 267 306 264M282 288Q294 292 306 288M284 311L303 314'},
{name:'obliques',path:'M249 218L275 230L272 289L278 332L246 313Q252 278 243 251Z',fibers:'M249 245L271 259M250 263L271 278M249 281L272 298M248 300L275 320'},
{name:'adductors',path:'M285 352L303 378L290 434L284 477Q273 454 274 415Z',fibers:'M288 370L282 448M294 382L288 428'},
{name:'quadriceps',path:'M263 363C270 358 277 372 276 388L272 443Q268 466 263 473Q257 458 256 437L256 388Q256 373 263 363Z',fibers:'M261 375Q254 423 259 467M270 375Q277 422 266 470M266 383L263 453'},
{name:'quadriceps',path:'M247 368Q253 382 251 408C247 431 251 456 260 476Q251 483 244 468C230 446 231 407 239 385Z',fibers:'M243 385L242 425L246 463'},
{name:'quadriceps',path:'M281 421Q282 436 288 447C292 463 284 484 277 489Q265 487 269 473Q280 448 281 421Z'},
{name:'tibialis',path:'M261 523Q268 519 271 531C273 547 266 567 263 583L257 626L253 631Q253 609 255 589L255 544Q255 530 261 523Z',fibers:'M262 530L255 618M268 531L259 605'},
{name:'calves',path:'M247 531Q239 558 245 581L250 603L253 575Z'}
];
export const backMuscles:Muscle[]=[
{name:'back',path:'M292 130L303 140L307 230Q281 206 250 189L234 169Q270 164 292 130Z',fibers:'M298 148L248 176M301 164L257 183M304 183L270 197'},
{name:'shoulders',path:'M247 155Q223 151 214 174L218 202L241 188L258 167Z'},
{name:'back',path:'M248 207Q267 211 295 230L304 320L275 338Q250 303 246 272Z',fibers:'M251 222L296 266M250 240L298 289M253 262L298 309M260 286L291 320'},
{name:'triceps',path:'M224 206Q203 224 197 258L202 276Q220 261 228 230Z',fibers:'M219 217L205 266M224 220L211 255'},
{name:'forearms',path:'M195 284Q181 299 178 323L163 360L174 365Q193 332 198 311Z'},
{name:'gluteals',path:'M251 340Q278 329 305 348L305 380Q280 408 243 384Q233 361 251 340Z',fibers:'M299 348Q269 344 246 361M300 358Q274 354 244 373M296 370Q272 384 251 384'},
{name:'hamstrings',path:'M245 398Q258 403 270 399Q270 435 262 479L253 502Q243 483 243 455Z',fibers:'M251 408L250 468L254 490M262 409L257 478'},
{name:'hamstrings',path:'M278 397L299 391L289 448L280 492L270 501Q276 458 271 435Z',fibers:'M286 405L279 470M293 401L283 450'},
{name:'calves',path:'M252 520Q266 513 272 532L268 568L256 592Q242 574 244 550Z',fibers:'M252 531L253 576M264 531L260 576'},
{name:'calves',path:'M275 523Q286 532 281 557L270 589L263 597L268 562Z'},
{name:'calves',path:'M257 589L265 589L262 630L254 639Z'}
];
export const arteries:[string,number][]=[
['M323 221C318 206 304 201 304 188C304 171 327 168 333 183L327 211L320 281L319 343L316 386',4.2],
['M309 178L298 157L298 114L294 92M327 177L322 154L322 113L327 90',2.1],
['M306 184Q271 171 239 181L219 229L199 279L182 329L165 377',2.7],
['M331 184Q361 172 385 182L406 230L423 279L443 330L455 377',2.7],
['M199 279L194 319L174 374M423 279L426 320L449 374',1.25],
['M316 385L285 409L274 466L262 509L258 563L255 634L246 659',3],
['M316 385L341 409L348 466L357 509L360 563L365 634L376 659',3],
['M280 424Q248 435 250 471M274 455L286 480M342 424Q375 437 370 471M348 455L337 480',1.1],
['M260 512L248 544L250 591M358 512L372 544L370 591',1.3],
['M321 279Q299 267 271 284M322 298Q344 283 350 290M319 320L283 315M319 312L347 305M319 326Q300 333 301 362M301 341L283 351M303 352L328 365',1.5],
['M164 377L156 393M164 377L163 402M455 377L461 395M455 377L453 400',.8]
];
export const veins:[string,number][]=[
['M302 394L305 345L304 291L305 248L308 221M308 221L305 187L288 158L289 109M306 187L336 160L335 110',3],
['M171 382L191 327L207 281L228 226L241 190Q274 184 305 188',2],
['M451 382L435 327L417 281L398 226L380 190Q342 181 306 188',2],
['M250 641L251 579L252 525L266 470L276 416L302 394',2.3],
['M370 641L368 579L366 525L354 470L345 416L302 394',2.3],
['M268 286Q288 285 305 283M284 317L305 314M347 307L305 310',1.3]
];
export const nutrientRoutes=[
{id:'portal',d:'M312 359Q270 343 281 283',kind:'glucose'},
{id:'distribution',d:'M281 283Q303 281 308 224',kind:'glucose'},
{id:'brainfuel',d:'M323 220L308 178L298 141L299 81',kind:'glucose'},
{id:'musclefuel',d:'M324 225L319 342L316 387L282 420L266 460',kind:'glucose'},
{id:'armfuel',d:'M322 215Q286 169 239 184L216 239',kind:'glucose'},
{id:'proteinportal',d:'M315 360Q269 340 281 283',kind:'amino'},
{id:'proteinrepair',d:'M281 283Q302 273 310 218Q359 170 384 185L403 239',kind:'amino'},
{id:'lymph',d:'M330 355Q348 312 340 264L337 172Q318 182 308 221',kind:'fat'},
{id:'fatstore',d:'M324 226Q354 271 369 311',kind:'fat'},
{id:'fatfuel',d:'M369 311Q321 329 318 387L343 421L354 458',kind:'fat'}
];
const liver='M250 273C266 259 283 263 304 270L332 278Q325 289 302 290L272 309Q251 313 249 297Z';
const rightLung='M299 170Q281 167 269 188C258 207 255 234 258 257Q274 268 300 260L303 231L301 202Z';
const leftLung='M321 170Q339 169 352 190Q367 225 362 258Q348 266 336 257L333 241Q341 225 329 212L320 212Z';
function musclesMarkup(list:Muscle[],view:string){return `<g id="muscles-${view}" class="muscle-set">${list.map(m=>`<g data-muscle="${m.name}"><path class="muscle-shape" d="${m.path}"/><path class="muscle-shape" d="${m.path}" transform="translate(620 0) scale(-1 1)"/>${m.fibers?`<path class="muscle-fibers" d="${m.fibers}"/><path class="muscle-fibers" d="${m.fibers}" transform="translate(620 0) scale(-1 1)"/>`:''}</g>`).join('')}</g>`;}
// Female and male figures share one outline topology and every organ, route and muscle coordinate; only the contour is reshaped.
export const anatomyLabel=(sex:'male'|'female',view:'front'|'back')=>`Interactive educational anatomy, ${sex} body, ${view==='front'?'anterior':'posterior'} view`;
export function anatomyMarkup(sex:'male'|'female'='male'){return `<svg id="body-svg" viewBox="0 0 620 720" data-sex="${sex}" aria-label="${anatomyLabel(sex,'front')}">
<defs>
<linearGradient id="skin" x1="0" x2="1"><stop stop-color="#9eaea0" stop-opacity=".1"/><stop offset=".4" stop-color="#c8d6bd" stop-opacity=".19"/><stop offset=".6" stop-color="#dce3c6" stop-opacity=".1"/><stop offset="1" stop-color="#809b87" stop-opacity=".17"/></linearGradient>
<linearGradient id="muscle-tissue" x1="0" y1="0" x2="1" y2=".5"><stop stop-color="#765a46"/><stop offset=".48" stop-color="#b39777"/><stop offset="1" stop-color="#5b5548"/></linearGradient>
<radialGradient id="liver-tissue" cx=".3" cy=".25"><stop stop-color="#b08069"/><stop offset=".8" stop-color="#734e41"/><stop offset="1" stop-color="#493e32"/></radialGradient>
<radialGradient id="heart-tissue" cx=".45" cy=".25"><stop stop-color="#d49784"/><stop offset=".58" stop-color="#9d5c4f"/><stop offset="1" stop-color="#573c35"/></radialGradient>
<linearGradient id="lung-tissue" x2="1" y2="1"><stop stop-color="#b29b85" stop-opacity=".6"/><stop offset=".5" stop-color="#9d9d88" stop-opacity=".44"/><stop offset="1" stop-color="#706f5d" stop-opacity=".26"/></linearGradient>
<linearGradient id="gut-tissue" x2="1" y2="1"><stop stop-color="#c4ac8e"/><stop offset="1" stop-color="#8b7762"/></linearGradient>
<radialGradient id="body-aura"><stop stop-color="#637d58" stop-opacity=".14"/><stop offset="1" stop-color="#537547" stop-opacity="0"/></radialGradient>
<clipPath id="body-clip"><path d="${outline}"/></clipPath>
<clipPath id="liver-clip"><path d="${liver}"/></clipPath>
<marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto"><path d="M0 0L10 5L0 10" fill="#d9ad65"/></marker>
</defs>
<ellipse cx="310" cy="350" rx="205" ry="330" fill="url(#body-aura)"/>
<g class="scan-grid" fill="none" stroke="#799578" stroke-opacity=".17"><ellipse cx="310" cy="681" rx="103" ry="12"/><path d="M126 140v-22h22M494 140v-22h-22M126 555v22h22M494 555v22h-22"/></g>
<g id="body-tissues">
<path id="body-outline" d="${outline}" fill="url(#skin)" stroke="#9baa8f" stroke-opacity=".55" stroke-width="1.1"/>
<path id="body-soft-tissue" fill="#c6ad82" fill-opacity=".13" fill-rule="evenodd" pointer-events="none"/>
<g class="surface-contours" stroke="#b5bda5" stroke-opacity=".22" stroke-width=".7" fill="none"><path d="M286 61Q297 51 310 54Q323 51 334 61M286 81Q299 86 301 93M334 81Q321 86 319 93M301 98Q310 101 319 98M291 111Q310 119 329 111M307 140L310 158L313 140M257 155Q280 148 303 158M363 155Q340 148 317 158M309 270L310 320M242 331L279 348L301 378M378 331L341 348L319 378M255 494Q265 487 275 495M345 495Q355 487 365 494"/></g>
<g id="muscles" clip-path="url(#body-clip)">${musclesMarkup(frontMuscles,'front')}${musclesMarkup(backMuscles,'back')}</g>
<g id="front-internals" clip-path="url(#body-clip)">
<g class="skeletal-detail" fill="none" stroke="#c0c1a7" stroke-opacity=".15" stroke-width="1.2"><path d="M309 164L309 240M292 213L292 263M330 213L330 263"/>${[0,1,2,3,4,5].map(i=>`<path d="M306 ${181+i*12}Q279 ${172+i*13} 260 ${191+i*12}M314 ${181+i*12}Q341 ${172+i*13} 360 ${191+i*12}"/>`).join('')}<path d="M258 267Q277 273 308 261Q340 273 363 267"/></g>
<g id="circulation" fill="none" stroke-linecap="round" stroke-linejoin="round"><g class="veins" stroke="#719daa" opacity=".54">${veins.map(([d,w])=>`<path d="${d}" stroke-width="${w}"/>`).join('')}</g><g class="arteries" stroke="#bd7463" opacity=".76">${arteries.map(([d,w])=>`<path d="${d}" stroke-width="${w}"/>`).join('')}</g><g class="blood-flow" stroke="#eaa68d" stroke-width="1.8" stroke-dasharray="1 21">${arteries.slice(0,8).map(([d])=>`<path d="${d}"/>`).join('')}</g><g class="venous-flow" stroke="#95c6cd" stroke-width="1.1" stroke-dasharray="1 25">${veins.slice(0,5).map(([d])=>`<path d="${d}"/>`).join('')}</g></g>
<g id="organs">
<g id="organ-brain" class="organ" data-organ="brain" tabindex="0" role="button" aria-label="Inspect brain"><path d="M310 51C304 43 293 48 290 54C280 54 281 68 284 72C278 82 286 93 296 94L309 98L321 94C333 94 342 82 336 72C341 61 333 52 327 54C321 46 314 46 310 51Z" fill="#b7b495" stroke="#d0c7a1" stroke-opacity=".65" fill-opacity=".65"/><g fill="none" stroke="#646e55" stroke-width="1.2"><path d="M309 53L309 93M301 52Q290 55 296 66Q285 69 294 78Q288 84 301 89M299 59Q306 63 300 70Q306 78 299 84M318 52Q330 56 325 65Q337 70 327 77Q335 86 316 90M320 60Q313 65 320 71Q314 78 323 83M286 62Q290 62 292 66M334 62L329 65"/></g></g>
<g id="organ-lungs" class="organ cardio-organ" data-organ="lungs" tabindex="0" role="button" aria-label="Inspect lungs"><path d="${rightLung}" fill="url(#lung-tissue)" stroke="#b9ac93" stroke-opacity=".5"/><path d="${leftLung}" fill="url(#lung-tissue)" stroke="#b9ac93" stroke-opacity=".5"/><g fill="none" stroke="#bdad90" stroke-opacity=".65"><path d="M311 139L311 195L286 216M311 195L339 212" stroke-width="4"/><path d="M287 211L277 202M289 214L279 235M289 214L295 242M339 212L347 199M339 212L349 236M340 218L335 249" stroke-width="1.5"/><path d="M300 222L260 225M302 234L276 260M328 218L358 251" stroke-width=".8"/></g><g stroke="#a5a68c" stroke-width=".8">${[0,1,2,3,4,5].map(i=>`<path d="M307 ${145+i*7}h8"/>`).join('')}</g></g>
<g class="pulmonary-circuit" fill="none" stroke-linecap="round"><path d="M318 223Q324 201 316 201L286 211M318 206L344 210" stroke="#709da6" stroke-width="3"/><path d="M284 225L306 231M344 223L326 235" stroke="#d2947c" stroke-width="2.5"/></g>
<g id="organ-heart" class="organ cardio-organ" data-organ="heart" tabindex="0" role="button" aria-label="Inspect heart"><path d="M311 211C299 213 297 226 304 240C309 251 323 259 331 266C343 260 347 244 343 231C340 219 331 214 322 216L319 209Z" fill="url(#heart-tissue)" stroke="#c4967e" stroke-width=".9"/><path d="M317 218Q319 239 332 263M305 226Q322 226 338 239M320 235L312 244M329 248L340 250" fill="none" stroke="#ead0a6" stroke-width="1" stroke-opacity=".63"/><path d="M324 216Q315 205 318 191Q326 181 334 191L332 211" fill="none" stroke="#c1856d" stroke-width="5"/><path d="M324 191L322 183M329 189L331 180M334 194L340 187" stroke="#c1856d" stroke-width="2"/></g>
<g id="viscera">
<g id="organ-kidneys" class="organ" data-organ="kidneys" tabindex="0" role="button" aria-label="Inspect kidneys"><path d="M283 307Q271 302 268 316Q265 332 276 338Q290 341 288 327L281 324L287 319Q289 312 283 307Z" fill="#90675a" stroke="#b18c75" opacity=".55"/><path d="M344 296Q357 292 360 306Q363 322 352 328Q338 331 340 317L347 314L341 309Q338 303 344 296Z" fill="#90675a" stroke="#b18c75" opacity=".55"/><path d="M282 326L296 375M346 316L326 375" fill="none" stroke="#b9a17c" stroke-opacity=".3"/></g>
<g id="organ-liver" class="organ" data-organ="liver" tabindex="0" role="button" aria-label="Inspect liver glycogen"><path d="${liver}" fill="url(#liver-tissue)" stroke="#c59977" stroke-opacity=".65"/><path d="M301 270Q294 286 302 290M252 293Q271 292 290 299" fill="none" stroke="#c5a084" stroke-opacity=".4"/><g clip-path="url(#liver-clip)" id="liver-storage" fill="#a9ce8d" opacity=".25">${Array.from({length:24},(_,i)=>`<circle cx="${257+(i%8)*8}" cy="${279+Math.floor(i/8)*8}" r="1.8"/>`).join('')}</g><path d="M287 296Q296 299 291 310Q284 316 282 307Z" fill="#8d9668" stroke="#acb07d" stroke-width=".6"/></g>
<g id="organ-gut" class="organ" data-organ="gut" tabindex="0" role="button" aria-label="Inspect digestion"><path d="M323 256L329 274Q339 269 348 278Q361 291 350 309Q341 325 328 320Q318 315 319 307Q325 301 328 310Q339 313 339 302Q336 294 324 293Q317 282 320 273Z" fill="url(#gut-tissue)" stroke="#cbb194" stroke-width="1"/><path d="M337 281Q350 291 340 305M332 283Q345 290 335 303" fill="none" stroke="#765947" stroke-opacity=".5"/><path d="M271 366L268 337Q269 327 279 327Q309 322 342 330Q353 330 351 342L347 376Q345 389 329 386L320 395" fill="none" stroke="#8b7962" stroke-width="10" stroke-linecap="round"/><path d="M271 366L268 337Q269 327 279 327Q309 322 342 330Q353 330 351 342L347 376Q345 389 329 386L320 395" fill="none" stroke="#c5aa88" stroke-opacity=".65" stroke-width="6" stroke-dasharray="6 2" stroke-linecap="round"/>
<path d="M281 340C299 329 320 345 336 338C348 347 320 352 297 343C279 338 274 351 293 354C314 347 340 349 336 360C331 371 313 353 289 362C275 369 294 377 310 366C320 360 339 370 328 378C312 386 294 374 283 381" fill="none" stroke="#7f705e" stroke-width="8" stroke-linecap="round"/><path d="M281 340C299 329 320 345 336 338C348 347 320 352 297 343C279 338 274 351 293 354C314 347 340 349 336 360C331 371 313 353 289 362C275 369 294 377 310 366C320 360 339 370 328 378C312 386 294 374 283 381" fill="none" stroke="#c3aa8c" stroke-width="4.5" stroke-linecap="round"/></g>
<g id="organ-pancreas" class="organ" data-organ="pancreas" tabindex="0" role="button" aria-label="Inspect insulin signal"><path d="M289 316Q294 307 304 311L337 315Q335 321 317 320L299 324Q288 325 289 316Z" fill="#aa96b3" stroke="#c6b4c9" stroke-width=".8"/><path d="M295 314L298 320M304 313L307 318M315 314L318 318" stroke="#756581" stroke-width=".7"/><ellipse id="insulin-ring" cx="311" cy="317" rx="31" ry="12" fill="none" stroke="#b99cde" stroke-width="2"/></g>
</g></g>
<g id="nutrient-routes" fill="none" stroke-width=".8" stroke-opacity=".18">${nutrientRoutes.map(r=>`<path id="route-${r.id}" d="${r.d}" stroke="${r.kind==='glucose'?'#e4b467':r.kind==='amino'?'#81cbd5':'#d7c597'}" marker-end="url(#flow-arrow)"/>`).join('')}</g>
<g id="nutrient-particles">${nutrientRoutes.map((r,j)=>[0,.33,.66].map(f=>r.kind==='glucose'?`<circle class="particle" data-route="${j}" data-offset="${f}" r="2.1" fill="#f0c27c"/>`:r.kind==='amino'?`<path class="particle" data-route="${j}" data-offset="${f}" d="M0-2.7L2.7 0L0 2.7L-2.7 0Z" fill="#95d6df"/>`:`<rect class="particle" data-route="${j}" data-offset="${f}" x="-2.2" y="-2.2" width="4.4" height="4.4" rx=".5" fill="#d8c698"/>`).join('')).join('')}</g>
<g id="insulin-signals" fill="none" stroke="#b59bda" stroke-width="2"><ellipse cx="268" cy="189" rx="25" ry="13"/><ellipse cx="352" cy="189" rx="25" ry="13"/><ellipse cx="267" cy="433" rx="14" ry="32"/><ellipse cx="353" cy="433" rx="14" ry="32"/><ellipse cx="277" cy="284" rx="27" ry="16"/></g>
<g id="caffeine-signals" opacity="0" fill="none" stroke="#ecac79" pointer-events="none"><path id="caffeine-route" d="M321 350Q327 316 284 290Q280 273 297 262L311 233Q302 190 308 150L310 92" stroke-width="1" stroke-dasharray="3 5" stroke-opacity=".4"/><ellipse id="caffeine-brain" cx="310" cy="76" rx="35" ry="41" stroke-width="2"/><ellipse id="caffeine-liver" cx="279" cy="284" rx="35" ry="24" stroke-width="1.5"/><path class="caffeine-particle" d="M0-4L3.5-2L3.5 2L0 4L-3.5 2L-3.5-2Z" stroke-width="1.5" fill="#263325"/><path class="caffeine-particle" d="M0-4L3.5-2L3.5 2L0 4L-3.5 2L-3.5-2Z" stroke-width="1.5" fill="#263325"/><path class="caffeine-particle" d="M0-4L3.5-2L3.5 2L0 4L-3.5 2L-3.5-2Z" stroke-width="1.5" fill="#263325"/></g>
</g>
</g>
<g class="anatomy-labels" fill="#a4b398" font-family="system-ui" font-size="10" letter-spacing="1.2"><g class="front-labels"><path d="M291 78H231L211 65H164M345 244H412L439 225H482M255 284H207L188 274H134M336 351H410L434 365H480" fill="none" stroke="#9fb18d" stroke-opacity=".35"/><text x="162" y="57">BRAIN</text><text x="443" y="217">HEART</text><text x="132" y="266">LIVER</text><text x="435" y="382">DIGESTION</text></g><g class="back-labels"><path d="M260 369H206L184 347H123M263 436H204L184 449H123M260 549H207L185 566H123" fill="none" stroke="#9fb18d" stroke-opacity=".4"/><text x="122" y="338">GLUTEALS</text><text x="122" y="465">HAMSTRINGS</text><text x="122" y="582">CALVES</text></g></g>
<text id="anatomy-view-label" x="310" y="709" text-anchor="middle" fill="#75896b" font-family="monospace" font-size="8" letter-spacing="1.6">ANTERIOR · EDUCATIONAL ANATOMY</text>
</svg>`;}
