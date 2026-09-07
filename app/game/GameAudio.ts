export type RadioCue=`story-${number}`|'checkpoint'|'generator'|'bunker'|'rooftop'|'signal'|'evac-ready'|'rescue'|'memory-checkpoint'|'memory-bunker'|'memory-rooftop';
export type AudioStatus={cue:RadioCue|null;playing:boolean;loading:boolean;error:string|null};

// A quiet, original score built from slow minor chords, filtered wind and distant pulses.
// Voices are prerecorded neural speech, then filtered through the same radio channel.
export class GameAudio {
  private context:AudioContext|null=null;
  private master!:GainNode;
  private recordingDestination:MediaStreamAudioDestinationNode|null=null;
  recordingStream(){if(!this.context)return null;if(!this.recordingDestination){this.recordingDestination=this.context.createMediaStreamDestination();this.master.connect(this.recordingDestination);}return this.recordingDestination.stream;}
  private music!:GainNode;
  private voiceGain!:GainNode;
  private voice:HTMLAudioElement|null=null;
  private pads:AudioScheduledSourceNode[]=[];
  private bedGain:GainNode|null=null;
  private timer:ReturnType<typeof setInterval>|null=null;
  private enabled=false;
  private musicLevel=.38;
  private voiceLevel=.85;
  private sector=-1;
  private beat=0;
  private nextBeat=0;
  private nextRotor=0;
  private paused=false;
  private manual=false;
  private blocked=false;
  private heard='';
  private language='en';
  private disposed=false;
  private enableRequest=0;
  private status:AudioStatus={cue:null,playing:false,loading:false,error:null};
  constructor(private onStatus:(status:AudioStatus)=>void){}

  private report(change:Partial<AudioStatus>){this.status={...this.status,...change};this.onStatus(this.status);this.mix();}
  private init(){
    if(this.context)return;
    const Context=window.AudioContext||(window as any).webkitAudioContext;
    if(!Context)throw new Error('Audio is unavailable in this browser.');
    const ctx:AudioContext=this.context=new Context();
    this.master=ctx.createGain();this.master.gain.value=0;
    const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-14;limiter.knee.value=12;limiter.ratio.value=4;
    this.master.connect(limiter).connect(ctx.destination);
    this.music=ctx.createGain();this.music.gain.value=0;this.music.connect(this.master);
    this.voiceGain=ctx.createGain();this.voiceGain.gain.value=this.voiceLevel;this.voiceGain.connect(this.master);
    this.voice=new Audio();this.voice.preload='auto';
    const radio=ctx.createBiquadFilter();radio.type='bandpass';radio.frequency.value=1700;radio.Q.value=.55;
    const warmth=ctx.createDynamicsCompressor();warmth.threshold.value=-24;warmth.ratio.value=3;
    ctx.createMediaElementSource(this.voice).connect(radio).connect(warmth).connect(this.voiceGain);
    this.voice.onplaying=()=>{if(!this.enabled||this.blocked){this.voice?.pause();this.report({playing:false,loading:false});return}this.report({playing:true,loading:false,error:null})};
    this.voice.onpause=()=>this.report({playing:false});
    this.voice.onended=()=>{this.staticBurst(.12);this.report({playing:false,loading:false})};
    this.voice.onerror=()=>this.report({playing:false,loading:false,error:'Radio audio could not load. The full message is shown below.'});
    this.timer=setInterval(()=>this.schedule(),180);
  }
  async setEnabled(enabled:boolean){
    const request=++this.enableRequest;
    if(this.disposed)return false;
    if(enabled){this.init();await this.context!.resume();if(this.disposed||request!==this.enableRequest)return this.enabled;}
    this.enabled=enabled;
    if(!enabled){this.voice?.pause();this.report({playing:false,loading:false});}
    if(this.context)this.master.gain.setTargetAtTime(enabled?.85:0,this.context.currentTime,.22);
    this.mix();
    return this.enabled;
  }
  setLevels(music:number,voice:number){this.musicLevel=music;this.voiceLevel=voice;this.mix()}
  private mix(){
    if(!this.context)return;
    const now=this.context.currentTime;
    this.music.gain.setTargetAtTime(this.musicLevel*(this.paused?.22:1)*(this.status.playing?.32:1),now,.5);
    this.voiceGain.gain.setTargetAtTime(this.voiceLevel,now,.08);
  }
  setLanguage(language:string){const next=language==='de'?'de':'en';if(next===this.language)return;this.language=next;this.heard='';this.stopRadio();}
  sync(game:any){
    this.setLanguage(game.language||'en');
    if(!this.context||!this.enabled)return;
    if(this.sector!==game.level){this.sector=game.level;this.makeBed();}
    if(game.level===2&&game.signal>=0&&game.signal<=8&&game.canAct&&this.context.currentTime>=this.nextRotor){
      const ctx=this.context,now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.value=48;gain.gain.setValueAtTime(.075*(1-game.signal/10),now);gain.gain.exponentialRampToValueAtTime(.001,now+.09);osc.connect(gain).connect(this.music);osc.start(now);osc.stop(now+.1);osc.onended=()=>{osc.disconnect();gain.disconnect()};this.nextRotor=now+.11;
    }
    const paused=!game.canAct;
    if(paused!==this.paused){this.paused=paused;this.mix()}
    const message=game.lastRadio;
    if(message&&message.id!==this.heard&&!this.status.playing&&!this.status.loading&&['playing','won'].includes(game.mode)&&!game.inventoryOpen&&!game.lootOpen){
      this.heard=message.id;
      if(this.status.cue!==message.voiceId||!this.status.playing&&!this.status.loading)void this.playRadio(message.voiceId,false);
      else this.manual=false;
    }
    this.blocked=game.inventoryOpen||game.lootOpen||game.mode==='dead'||game.mode==='paused'&&!this.manual;
    if(this.voice&&this.status.cue&&!this.voice.ended){
      if(this.blocked){this.voice.pause();if(this.status.loading)this.report({loading:false});}
      else if(this.voice.paused&&!this.status.error)void this.voice.play().catch(()=>{});
    }
  }
  async playRadio(cue:RadioCue,manual=true,messageId?:string){
    if(!this.enabled||!this.voice)return;
    if(messageId)this.heard=messageId;
    this.manual=manual;if(manual)this.blocked=false;this.voice.pause();this.voice.src=`/audio/radio/${this.language==='de'?'de/':''}${cue}.mp3`;
    this.report({cue,playing:false,loading:true,error:null});this.staticBurst(.2);
    try{await this.voice.play()}catch(error){if((error as Error).name!=='AbortError')this.report({loading:false,error:'Press Play radio call to enable voice playback.'});else this.report({loading:false})}
  }
  stopRadio(){if(this.voice){this.voice.pause();this.voice.currentTime=0;}this.report({cue:null,playing:false,loading:false});}
  private staticBurst(duration:number){
    if(!this.context||!this.enabled)return;
    const ctx=this.context,buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.22;
    const source=ctx.createBufferSource();source.buffer=buffer;
    const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=2100;
    const gain=ctx.createGain();gain.gain.value=.12;source.connect(filter).connect(gain).connect(this.voiceGain);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};
  }
  private makeBed(){
    if(!this.context)return;const ctx=this.context,now=ctx.currentTime;
    const oldGain=this.bedGain;
    if(oldGain){oldGain.gain.setTargetAtTime(0,now,.4);const old=this.pads;for(const source of old){source.stop(now+2);source.onended=()=>source.disconnect()}setTimeout(()=>oldGain.disconnect(),2500);}
    this.pads=[];const bed=this.bedGain=ctx.createGain();bed.gain.value=0;bed.gain.setTargetAtTime(1,now,1.8);bed.connect(this.music);
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=[660,440,1000][Math.max(0,this.sector)%3];filter.Q.value=.5;filter.connect(bed);
    const reverb=ctx.createConvolver(),impulse=ctx.createBuffer(2,Math.floor(ctx.sampleRate*3.4),ctx.sampleRate);
    for(let c=0;c<2;c++){const samples=impulse.getChannelData(c);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/samples.length,3)*.23}
    reverb.buffer=impulse;const wet=ctx.createGain();wet.gain.value=.5;filter.connect(reverb).connect(wet).connect(bed);
    const chords=[[73.416,110,146.832,174.614,220],[65.406,97.999,130.813,155.563,196],[73.416,110,164.814,220,261.626]][Math.max(0,this.sector)%3];
    chords.forEach((freq,i)=>{
      const tone=ctx.createOscillator(),amp=ctx.createGain(),pan=ctx.createStereoPanner();tone.type=i<2?'sine':'triangle';tone.frequency.value=freq;tone.detune.value=i%2?-5:4;amp.gain.value=i<2?.052:.019;pan.pan.value=(i-2)*.32;
      tone.connect(amp).connect(pan).connect(filter);tone.start();this.pads.push(tone);
      const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=.025+i*.008;depth.gain.value=.008;lfo.connect(depth).connect(amp.gain);lfo.start();this.pads.push(lfo);
    });
    const wind=ctx.createBufferSource(),noise=ctx.createBuffer(1,ctx.sampleRate*6,ctx.sampleRate),samples=noise.getChannelData(0);let last=0;
    for(let i=0;i<samples.length;i++){last=(last+.025*(Math.random()*2-1))/1.025;samples[i]=last*3.5}
    wind.buffer=noise;wind.loop=true;const windFilter=ctx.createBiquadFilter();windFilter.type='bandpass';windFilter.frequency.value=[450,180,750][Math.max(0,this.sector)%3];windFilter.Q.value=.4;const windGain=ctx.createGain();windGain.gain.value=.19;wind.connect(windFilter).connect(windGain).connect(bed);wind.start();this.pads.push(wind);
    this.nextBeat=now+2;this.beat=0;
  }
  private schedule(){
    const ctx=this.context;if(!ctx||!this.enabled||this.paused||ctx.state!=='running')return;
    const now=ctx.currentTime;if(now<this.nextBeat)return;this.nextBeat=now+[3.6,2.8,3.2][Math.max(0,this.sector)%3];
    const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(this.beat%4===0?73.416:55,now);oscillator.frequency.exponentialRampToValueAtTime(36,now+.9);
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.095,now+.04);gain.gain.exponentialRampToValueAtTime(.0001,now+1.5);oscillator.connect(gain).connect(this.music);oscillator.start();oscillator.stop(now+1.6);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};this.beat++;
  }
  dispose(){this.disposed=true;if(this.timer)clearInterval(this.timer);if(this.voice){this.voice.onplaying=this.voice.onpause=this.voice.onended=this.voice.onerror=null;this.voice.pause();this.voice.removeAttribute('src');this.voice.load()}void this.context?.close();this.context=null;}
}
