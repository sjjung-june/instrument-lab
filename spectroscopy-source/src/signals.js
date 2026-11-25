export function signalState(engine){
  const active=engine.status==='scanning',etching=engine.phase==='sputter';
  const pulsed=engine.kind==='sims'&&engine.technology==='tof';
  const depthCycle=engine.elapsed/(engine.duration/engine.total)%1;
  const phase=engine.mode==='depth'?(engine.elapsed<engine.duration/engine.total?depthCycle:Math.max(0,(depthCycle-.5)*2)):engine.elapsed/.6%1;
  const flightProgress=Math.max(0,Math.min(1,(phase-.15)/.7));
  return {etch:active&&etching,input:active&&!etching&&(!pulsed||phase<.15),output:active&&!etching&&(!pulsed||phase>=.15&&phase<.85),flightProgress:pulsed?flightProgress:engine.elapsed%1};
}
