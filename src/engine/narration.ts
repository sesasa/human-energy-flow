import { cueAt, type NarrationCue } from './narrationEvents';

export interface SpeechCallbacks { start:()=>void; end:()=>void; error:(reason:string)=>void }
export interface SpeechPort {
  readonly available:boolean;
  speak(text:string,rate:number,callbacks:SpeechCallbacks):void;
  cancel():void;
}

/** Native voices vary by browser/OS. Prefer a local English voice when available. */
export function browserSpeech():SpeechPort {
  const available=typeof window!=='undefined'&&'speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
  return {
    available,
    cancel(){if(available)window.speechSynthesis.cancel();},
    speak(text,rate,callbacks){
      if(!available){callbacks.error('Voice unavailable');return;}
      const synth=window.speechSynthesis,utterance=new SpeechSynthesisUtterance(text);
      const voices=synth.getVoices();
      utterance.voice=voices.find(v=>v.localService&&v.lang==='en-GB')||voices.find(v=>v.localService&&v.lang.startsWith('en'))||voices.find(v=>v.lang==='en-GB')||voices.find(v=>v.lang.startsWith('en'))||null;
      utterance.lang=utterance.voice?.lang||'en-GB';utterance.rate=rate;utterance.pitch=1;
      utterance.onstart=callbacks.start;utterance.onend=callbacks.end;
      utterance.onerror=e=>callbacks.error(e.error);
      if(synth.paused)synth.resume();
      synth.speak(utterance);
    }
  };
}

/** Event-based speech director. All boundaries are in shared simulation time.
 * Only one sentence is queued. Cancel/restart avoids unreliable mid-utterance
 * pause/resume on some native voices, and prevents old events after seeks.
 */
export class Narration {
  enabled=false;
  error='';
  current:NarrationCue|null=null;
  private cues:NarrationCue[]=[];
  private sentence=0;
  private state:'idle'|'pending'|'speaking'|'done'='idle';
  private generation=0;
  private started=0;
  private now=0;
  private speed=1;
  private running=false;
  constructor(private port:SpeechPort=browserSpeech()){}
  get available(){return this.port.available;}
  get speaking(){return this.state==='pending'||this.state==='speaking';}
  get caption(){return !this.enabled?this.current?.sentences.join(' ')||'':this.current?.sentences[Math.min(this.sentence,this.current.sentences.length-1)]||'';}
  get pacing(){return this.enabled&&this.running&&!this.error&&!!this.current&&this.state!=='done';}
  get rate(){return Math.max(.85,Math.min(1.22,.96+Math.log2(this.speed)*.1));}
  private seconds(text:string){return Math.max(1,text.trim().split(/\s+/).length/(2.35*this.rate)+.35);}
  private stop(){this.generation++;this.port.cancel();if(this.state!=='done')this.state='idle';}
  cancel(){this.stop();this.current=null;this.sentence=0;this.state='idle';this.running=false;}
  pause(){this.stop();this.running=false;}
  setTrack(cues:NarrationCue[]){this.cancel();this.cues=cues;}
  toggle(){this.enabled=!this.enabled;this.error='';this.stop();this.sentence=0;this.state='idle';return this.enabled;}
  sync(position:number,playing:boolean,speed:number,now:number){
    this.now=now;
    const cue=cueAt(this.cues,position);
    if(cue?.id!==this.current?.id){this.stop();this.current=cue;this.sentence=0;this.state='idle';}
    if(speed!==this.speed){this.speed=speed;if(this.speaking)this.stop();}
    this.running=playing;
    if(!playing||!this.enabled||!this.available||this.error){if(this.speaking)this.stop();return;}
    if(!cue||this.state==='done')return;
    if(this.speaking){
      const elapsed=(now-this.started)/1000;
      const limit=this.state==='pending'?4:this.seconds(cue.sentences[this.sentence])*2+5;
      if(elapsed>limit)this.fail('Voice unavailable · captions continue');
      return;
    }
    const token=++this.generation;
    this.state='pending';this.started=now;
    try {this.port.speak(cue.sentences[this.sentence],this.rate,{
      start:()=>{if(token===this.generation){this.state='speaking';this.started=this.now;}},
      end:()=>{if(token===this.generation){this.sentence++;this.state=this.sentence>=cue.sentences.length?'done':'idle';}},
      error:()=>{if(token===this.generation)this.fail('Voice unavailable · captions continue');}
    });}catch{this.fail('Voice unavailable · captions continue');}
  }
  private fail(message:string){this.stop();this.error=message;this.enabled=false;}
  /** Pace visuals to finish a cue in its event; then resume the selected speed.
   * Catch the next cue onset so a fast frame cannot skip a short sprint event.
   */
  maxRate(position:number,baseRate:number,frameSeconds:number){
    if(!this.enabled||!this.available||this.error||!this.running)return baseRate;
    let rate=baseRate;
    if(this.current&&this.state!=='done'){
      const texts=this.current.sentences.slice(this.sentence);
      let remaining=texts.reduce((n,t)=>n+this.seconds(t),0);
      if(this.state==='speaking')remaining-=(this.now-this.started)/1000;
      rate=Math.min(rate,Math.max(0,this.current.end-position-.00001)/Math.max(.5,remaining));
    }
    const next=this.cues.find(c=>c.start>position+1e-8);
    if(next&&frameSeconds>0)rate=Math.min(rate,(next.start-position)/frameSeconds);
    return Math.max(0,rate);
  }
}
