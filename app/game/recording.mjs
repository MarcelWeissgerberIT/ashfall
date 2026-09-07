export function recordingType(supports){return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(supports)||'';}
export function recordGame(source,audioStream,onDone,onError){
 if(typeof MediaRecorder==='undefined'||(!source?.captureStream&&!source?.getVideoTracks))throw Error('Recording is unavailable in this browser.');
 const stream=source.captureStream?source.captureStream(30):source;let recorder;
 // Use only the game's audio mix, preventing duplicated system/tab sound.
 for(const track of stream.getAudioTracks?.()||[]){stream.removeTrack(track);track.stop();}
 try{for(const track of audioStream.getAudioTracks())stream.addTrack(track.clone());const mimeType=recordingType(t=>MediaRecorder.isTypeSupported(t));recorder=new MediaRecorder(stream,{...(mimeType?{mimeType}:{}),videoBitsPerSecond:6000000,audioBitsPerSecond:160000});}
 catch(error){stream.getTracks().forEach(t=>t.stop());throw error;}
 const chunks=[];let failed=false;
 const stop=()=>{if(recorder.state!=='inactive')recorder.stop();};
 const videoTracks=stream.getVideoTracks?.()||[];for(const track of videoTracks)track.addEventListener('ended',stop);
 const cleanup=()=>{for(const track of videoTracks)track.removeEventListener('ended',stop);stream.getTracks().forEach(t=>t.stop());};
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onerror=()=>{failed=true;if(recorder.state!=='inactive')recorder.stop();cleanup();onError();};
 recorder.onstop=()=>{cleanup();if(!failed){if(chunks.length)onDone(new Blob(chunks,{type:recorder.mimeType||'video/webm'}));else onError();}};
 try{recorder.start(1000);}catch(error){cleanup();throw error;}
 return {stop(){if(recorder.state!=='inactive')recorder.stop();},dispose(){recorder.onstop=null;recorder.ondataavailable=null;recorder.onerror=null;if(recorder.state!=='inactive')recorder.stop();cleanup();}};
}
