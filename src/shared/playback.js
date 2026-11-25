export const PLAYBACK_RATES=[.1,.25,.5,1,2];
export class PlaybackClock{
  constructor(rate=.25){this.setRate(rate);this.previous=null;this.elapsed=0;this.realDelta=0;}
  setRate(rate){if(!PLAYBACK_RATES.includes(rate))throw new RangeError('Unsupported playback rate');this.rate=rate;}
  resetTimestamp(){this.previous=null;this.realDelta=0;}
  step(now){
    if(!Number.isFinite(now))return 0;
    this.realDelta=this.previous===null?0:Math.min(.1,Math.max(0,(now-this.previous)/1000));this.previous=now;
    const delta=this.realDelta*this.rate;this.elapsed+=delta*1000;return delta;
  }
}
