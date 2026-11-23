/* 01. ALBUM LIBRARY: edit each album's title, artwork, story, photos and links here. */
const albums = [
  {title:'My Story',track:'Sick Love',artist:'Red Hot Chili Peppers',musicUrl:'https://www.youtube.com/watch?v=I2XfVml6o24',audioFile:'assets/my-story-song.mp3',side:'SIDE A / THE BEGINNING',heading:'FROM PANAMA TO MADRID',image:'my_story_childhood.jpg',accent:'#ad4851',paper:'#f2e9db',description:'I am Angie Levy, a Communication and Digital Media student at IE University in Madrid. I grew up in Panama, where I discovered how much I love storytelling, creativity and making things happen. I love production, photography and turning ideas into experiences. From hosting Háblalo Einstein to working in TV production and creative teams, I enjoy being part of the story behind the work.',photos:['graduation.jpg','ie_tower.jpg','ie_friends.jpg','portrait.jpg'],notes:[261.63,329.63,392,440]},
  {title:'On Set',track:'Alive',artist:'Empire of the Sun',audioFile:'assets/alive.mp3',side:'SIDE B / BEHIND THE SCENES',heading:'BEHIND THE CAMERA',image:'joint.jpg',accent:'#5d6671',paper:'#e7e8e7',description:'I have worked on productions at Calle 7 Panamá and Toy o No Toy, and at creative agency Joint Creativo. I enjoy the mix of ideas, teamwork, writing and making the final result come together.',photos:['joint.jpg','joint_room.jpg','toy_placeholder.jpg'],notes:[196,246.94,293.66,369.99]},
  {title:'The Gallery',track:'Dreams',artist:'Fleetwood Mac',audioFile:'assets/dreams.mp3',side:'SIDE C / THROUGH MY LENS',heading:'THROUGH MY LENS',image:'lucky_playing.jpg',accent:'#755269',paper:'#eee1e9',description:'Photography lets me keep little moments that might otherwise disappear. These are some of the places, people and details I wanted to remember.',photos:['portrait.jpg','ie_friends.jpg','elevator.jpg','class.jpg'],notes:[220,277.18,329.63,415.3]},
  {title:'Just for Fun',track:'All the Stars',artist:'Kendrick Lamar & SZA',audioFile:'assets/all-the-stars.mp3',side:'SIDE D / PERSONAL INTERESTS',heading:'LIFE OUTSIDE THE FRAME',image:'just_for_fun_travel.jpg',coverImage:'just_for_fun_clean.png',accent:'#a13e4d',paper:'#f3e8dc',description:'Lately, I have been getting really into photography. I love taking my camera everywhere and capturing little moments and places I want to remember.',photos:[],notes:[174.61,220,261.63,349.23]},
  {title:'Contact Me',track:'Red Balloon',artist:'Charli XCX',audioFile:'assets/red-balloon.mp3',side:'CONTACT / THE NEXT TRACK',heading:'LET’S MAKE SOMETHING HAPPEN.',image:'contact_portrait.jpg',accent:'#987a6b',paper:'#f0e7df',description:'Have an idea, opportunity or question? I’d love to hear it. Let’s create something worth remembering.',photos:[],notes:[293.66,349.23,440,523.25]}
];
/* 02. DOM HELPERS and STATE: selected is the browsing choice; loaded is the disc on the platter. */
const $=id=>document.getElementById(id);
let opened=false,selected=0,loaded=-1,playing=false,speed=33,volume=.6,cueLifted=false,autoReturn=true,lampOn=false,needleDown=false,loading=false,toastTimer,loadGeneration=0;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const palette=a=>{document.documentElement.style.setProperty('--accent',a.accent);$('gatefoldRight').style.background=a.paper;};
/* 03. LOCAL ALBUM SOUNDTRACKS: each user-supplied MP3 belongs to one vinyl. */
let audioCtx,masterGain,musicTimer,musicStep=0;
const localTrack=new Audio();
// Keep the soundtrack ready, but only start it after a user interaction.
localTrack.preload='auto';
localTrack.preload='metadata';
let currentAudioFile='';
let galleryAudioPaused=false;
localTrack.addEventListener('error',()=>toast('Audio file unavailable: check the assets folder.'));
localTrack.addEventListener('ended',()=>{if(playing)setPlaying(false);});
function ensureAudio(){if(audioCtx)return true;const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;audioCtx=new Context();masterGain=audioCtx.createGain();masterGain.gain.value=volume*.20;masterGain.connect(audioCtx.destination);return true;}
function playNote(freq){if(!audioCtx||!playing)return;const now=audioCtx.currentTime;const osc=audioCtx.createOscillator(),env=audioCtx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(freq,now);env.gain.setValueAtTime(.0001,now);env.gain.exponentialRampToValueAtTime(.15,now+.025);env.gain.exponentialRampToValueAtTime(.0001,now+.3);osc.connect(env).connect(masterGain);osc.start(now);osc.stop(now+.32);}
function startMusic(){
 clearInterval(musicTimer);musicTimer=null;
 const album=albums[loaded];if(!album)return;
 if(album.audioFile){
  if(currentAudioFile!==album.audioFile){localTrack.pause();localTrack.src=album.audioFile;currentAudioFile=album.audioFile;localTrack.load();}
  localTrack.volume=volume;
  if(loaded===2&&galleryAudioPaused)return;
  localTrack.play().catch(err=>{console.error('Audio playback:',err);toast('Drag or click the needle to start the soundtrack.');});
  return;
 }
 // About Me has no assigned soundtrack; use a gentle original demo tone.
 if(!ensureAudio())return;audioCtx.resume().catch(()=>{});musicStep=0;
 const tick=()=>{if(playing&&loaded>=0)playNote(album.notes[musicStep++%album.notes.length]);};tick();musicTimer=setInterval(tick,480);
}
function stopMusic(){
 clearInterval(musicTimer);musicTimer=null;
 localTrack.pause();try{localTrack.currentTime=0;}catch(e){}
 galleryAudioPaused=false;

}
function pauseForPodcast(){
 // Pause Dreams without rewinding while the visitor browses podcast episodes.
 if(loaded===2&&playing&&!galleryAudioPaused){galleryAudioPaused=true;localTrack.pause();updateNowPlaying();}
}
function resumeAfterPodcast(){
 // Continue Dreams from the same second when leaving the podcast project.
 if(loaded===2&&playing&&galleryAudioPaused){galleryAudioPaused=false;localTrack.play().catch(console.error);updateNowPlaying();}
}
// Keep the contact sleeve's music control in sync with the turntable.

function updateVolume(){volume=Number($('pitchSlider').value)/100;$('pitchOutput').textContent=Math.round(volume*100)+'%';localTrack.volume=volume;if(masterGain&&audioCtx)masterGain.gain.setTargetAtTime(volume*.20,audioCtx.currentTime,.04);}
/* 04. RECORD RACK: the wheel, arrow buttons and dedicated scroll fader all navigate the same covers. */
function buildRack(){const rack=$('rack');albums.forEach((a,i)=>{const button=document.createElement('button');button.className='sleeve';button.type='button';button.setAttribute('aria-label','Select '+a.title);button.innerHTML=`<img src="assets/${a.coverImage||a.image}" alt=""><span class="sleeve-label">${a.title.toUpperCase()}</span>`;button.addEventListener('click',()=>{choose(i);if(opened&&!loading)loadRecord();});rack.append(button);});choose(0,false);}
function choose(i,scroll=true){selected=(i+albums.length)%albums.length;document.querySelectorAll('.sleeve').forEach((node,n)=>{node.classList.toggle('selected',n===selected);node.setAttribute('aria-pressed',String(n===selected));});$('rackSlider').value=selected;if($('discoveryValue'))$('discoveryValue').textContent=String(selected+1).padStart(2,'0')+' / '+String(albums.length).padStart(2,'0');if(scroll){const sleeve=document.querySelectorAll('.sleeve')[selected],viewport=$('rackViewport');viewport.scrollTo({left:sleeve.offsetLeft-viewport.offsetLeft-(viewport.clientWidth-sleeve.offsetWidth)/2,behavior:'smooth'});}if(opened)message('SELECTED: '+albums[selected].title.toUpperCase()+' · LOAD TO PLAY');}
$('rackViewport').addEventListener('wheel',event=>{if(!opened)return;event.preventDefault();const dir=Math.sign(Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY);if(dir&&Date.now()-lastWheel>220){lastWheel=Date.now();choose(selected+dir);}},{passive:false});let lastWheel=0;
/* 05. INTRO: the lid and camera move together; no Three.js or external dependencies. */
function openPlayer(){if(opened)return;opened=true;const game=$('game');game.classList.add('centering-player');$('openButton').disabled=true;$('intro').setAttribute('aria-hidden','true');window.setTimeout(()=>{if(!opened)return;game.classList.add('opening-lid');window.setTimeout(()=>{if(!opened)return;game.classList.add('opened');game.classList.remove('centering-player','opening-lid');$('openButton').disabled=false;message('CHOOSE A COVER ABOVE, THEN LOAD THE RECORD');toast('Welcome to the listening room');setStep(2);},1150);},1050);}
/* 06. PHYSICAL RECORD SWAP: opens the sleeve, slides the disc out, then loads the platter. */
async function loadRecord(){if(!opened){openPlayer();return;}if(loading)return;loading=true;const generation=++loadGeneration;closeFolder();setPlaying(false);$('dragHint').classList.remove('visible');$('record').classList.remove('loaded');const a=albums[selected];const obj=$('albumObject');palette(a);$('albumCover').src='assets/'+(a.coverImage||a.image);$('albumFrontName').textContent=a.title.toUpperCase();$('backTitle').textContent=a.title.toUpperCase();$('backSide').textContent='A LITTLE PREVIEW';$('backSubtitle').textContent=a.heading;$('backPreviewImage').src='assets/'+a.image;$('albumDiscLabel').style.background=a.accent;obj.className='album-object active';await wait(180);if(generation!==loadGeneration)return;obj.classList.add('opened-sleeve');await wait(470);if(generation!==loadGeneration)return;obj.classList.add('disc-out');await wait(490);if(generation!==loadGeneration)return;obj.classList.add('to-player');await wait(650);if(generation!==loadGeneration)return;loaded=selected;$('recordTitle').textContent=a.title.toUpperCase();$('recordSticker').style.background=`radial-gradient(circle at 25% 20%,${a.paper},${a.accent})`;$('record').classList.add('loaded');obj.className='album-object';updateNowPlaying();$('dragHint').classList.add('visible');message('DRAG THE NEEDLE ONTO THE VINYL TO PLAY');$('tonearm').setAttribute('aria-valuenow','0');needleDown=false;loading=false;setStep(3);toast(a.title+' is ready — drag the needle');}
/* 07. NEEDLE DRAG: dragging toward the record plays music and opens the actual sleeve. */
function setPlaying(on){playing=Boolean(on&&loaded>=0&&!cueLifted);updateNowPlaying();$('record').classList.toggle('spinning',playing);$('record').classList.toggle('fast',speed===45);$('tonearm').classList.toggle('engaged',playing);$('tonearm').setAttribute('aria-valuenow',playing?'1':'0');$('indicator').classList.toggle('on',playing);$('deckStatus').textContent=playing?'PLAYING':loaded>=0?'READY':'STANDBY';$('trackingFill').style.width=playing?'66%':'0%';if(playing){startMusic();$('dragHint').classList.remove('visible');}else{stopMusic();}}
function needlePlay(){if(!opened){openPlayer();return;}if(loading){toast('Wait for the record to load');return;}if(loaded<0){toast('Choose and load a record first');return;}if(cueLifted){cueLifted=false;$('cueIcon').textContent='↑';}needleDown=true;setPlaying(true);openFolder();setStep(4);}
const tonearm=$('tonearm');let pointerStart=null;
tonearm.addEventListener('pointerdown',e=>{if(!opened||loaded<0){toast('Load an album first');return;}pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId};tonearm.classList.add('dragging');tonearm.setPointerCapture(e.pointerId);});
tonearm.addEventListener('pointermove',e=>{if(!pointerStart)return;const dx=e.clientX-pointerStart.x;const dy=e.clientY-pointerStart.y;const degrees=Math.max(-20,Math.min(23,-20+Math.max(0,-dx+dy)*.65));tonearm.style.transform=`rotate(${degrees}deg)`;});
tonearm.addEventListener('pointerup',e=>{if(!pointerStart)return;const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;pointerStart=null;tonearm.classList.remove('dragging');tonearm.style.transform='';if(-dx+dy>28){needlePlay();}else if(playing){setPlaying(false);toast('Needle lifted');}else{toast('Drag the needle down and left onto the vinyl');}});
tonearm.addEventListener('click',()=>{if(opened&&loaded>=0&&!loading&&!playing)needlePlay();});
tonearm.addEventListener('pointercancel',()=>{pointerStart=null;tonearm.classList.remove('dragging');tonearm.style.transform='';});
/* Keyboard activation only: arrow keys are reserved for browsing photos in open sleeves. */
tonearm.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();needlePlay();}});
/* 08. GATEFOLD CONTENT: photos and real links live inside the opened sleeve. */
let sleevePhotoIndex=0;
function openFolder(){sleevePhotoIndex=0;if(loaded<0){toast('Load a record first');return;}const a=albums[loaded];palette(a);$('folderImage').src='assets/'+a.image;$('folderTitle').textContent=a.title.toUpperCase();$('folderSide').textContent=loaded===0?'GET TO KNOW ME':a.title.toUpperCase()+' · INSIDE THE RECORD';$('folderSignature').textContent=loaded===0?'FROM PANAMA TO MADRID · A LITTLE ABOUT ME':'A CLOSER LOOK AT '+a.title.toUpperCase();$('folderFootnote').textContent=loaded===0?'SOME OF THE MOMENTS THAT SHAPED MY STORY':'PHOTOS, MOMENTS & STORIES FROM '+a.title.toUpperCase();$('folderHeading').textContent=a.heading;$('folderDescription').textContent=a.description;const grid=$('mediaGrid');grid.replaceChildren();// Music is controlled by the turntable; no redundant song link.
a.photos.forEach(file=>{const btn=document.createElement('button');btn.type='button';btn.title='View photo';const img=document.createElement('img');img.src='assets/'+file;img.alt='Photo from '+a.title;btn.append(img);btn.addEventListener('click',()=>{sleevePhotoIndex=a.photos.indexOf(file);$('folderImage').src=img.src;});grid.append(btn);});(a.links||[]).forEach(([label,url])=>{const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=label+' ↗';grid.append(link);});if(loaded===0){
  // My Story combines the original photo timeline with the former About Me facts.
    renderStoryMemoryBook(grid);

 }
 if(loaded===1){openOnSet();}
 if(loaded===3){renderJustForFun(grid);}
 if(loaded===4){renderContactGame(grid);}
 if(loaded===2){openGalleryInside();}else{closeGalleryInside();}$('gatefold').classList.add('visible');$('gatefold').setAttribute('aria-hidden','false');$('gatefoldRight').scrollTop=0;grid.scrollTop=0;requestAnimationFrame(()=>{grid.scrollTop=0;$('gatefoldRight').scrollTop=0;});message('EXPLORE THE RECORD SLEEVE · CLOSE TO RETURN TO THE PLAYER');setStep(4);}
/* SIDE D: A playful interactive collection of personal interests, not a second projects gallery. */
function renderJustForFun(grid){
 const collections = {
  'NEW YORK': ['dscf0211.jpg','dscf0221.jpg','dscf0242.jpg','dscf0278.jpg','dscf0311.jpg','dscf0321.jpg','dscf0323.jpg','dscf0325.jpg','dscf0329.jpg'],
  'SEVILLA': ['dscf0555.jpg','dscf0564.jpg','dscf0571.jpg','dscf0581.jpg','dscf0582.jpg','dscf0585.jpg'],
  'IBIZA': ['dscf0686.jpg','dscf0701.jpg','dscf0702.jpg','dscf0795.jpg','dscf0838.jpg','dscf0880.jpg','dscf0891.jpg','dscf0892.jpg','dscf0898.jpg','dscf0906.jpg'],
  'LANZAROTE': ['dscf1147.jpg','dscf1152.jpg','dscf1163.jpg','dscf1175.jpg','dscf1178.jpg','dscf1180.jpg','dscf1193.jpg','dscf1212.jpg']
 };
 grid.innerHTML=`<div class="fun-room photo-only"><div class="fun-intro"><span>PERSONAL COLLECTION / THROUGH MY EYES</span><h4>JUST FOR FUN<span>.</span></h4><p>Lately, I've been getting really into photography. I love taking my camera everywhere and capturing little moments, places, and details I want to remember. Here's a look through my camera roll.</p></div><div class="fun-camera"><div class="camera-head"><div><span class="camera-red-dot">●</span> PLAYBACK MODE <span class="camera-model">FUJIFILM X-T30 / PANCAKE LENS</span></div><span>THROUGH MY CAMERA</span></div><div class="camera-places" role="group" aria-label="Choose photo collection"></div><div class="camera-viewer" aria-label="Camera photograph viewer"><button type="button" class="camera-prev camera-edge" aria-label="Previous photograph">‹</button><img class="camera-main" src="assets/dscf0211.jpg" alt="Travel photograph"><button type="button" class="camera-next camera-edge" aria-label="Next photograph">›</button><span class="camera-corner tl"></span><span class="camera-corner tr"></span><span class="camera-corner bl"></span><span class="camera-corner br"></span><span class="camera-number">IMG 0001</span><span class="camera-frame-count">01 / 09</span></div><div class="camera-strip" aria-label="Photo thumbnails"></div><div class="camera-progress"><div></div></div><p class="camera-credit">FUJIFILM X-T30 · PANCAKE LENS</p></div></div>`;
 const camera=grid.querySelector('.fun-camera'), strip=camera.querySelector('.camera-strip'),places=camera.querySelector('.camera-places');
 const destinations=Object.keys(collections);let frame=0,place=destinations[0];
 function showFrame(i){const shots=collections[place];frame=i;camera.querySelector('.camera-main').src='assets/'+shots[frame];camera.querySelector('.camera-main').alt='Photograph '+(frame+1)+' from '+place;camera.querySelector('.camera-number').textContent='IMG '+String(frame+1).padStart(4,'0');camera.querySelector('.camera-frame-count').textContent=String(frame+1).padStart(2,'0')+' / '+String(shots.length).padStart(2,'0');camera.querySelector('.camera-progress div').style.width=((frame+1)/shots.length*100)+'%';[...strip.children].forEach((btn,j)=>btn.classList.toggle('active',j===frame));const chosen=strip.children[frame];if(chosen){const l=chosen.offsetLeft-strip.offsetLeft;strip.scrollTo({left:Math.max(0,l-strip.clientWidth/2+chosen.clientWidth/2),behavior:'smooth'});}}
 function selectPlace(name,index=0){place=name;frame=0;places.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.place===name);b.setAttribute('aria-pressed',String(b.dataset.place===name));});strip.replaceChildren();collections[name].forEach((file,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','View photograph '+(i+1));b.innerHTML=`<img loading="lazy" src="assets/${file}" alt="">`;b.onclick=()=>showFrame(i);strip.append(b);});strip.scrollLeft=0;showFrame(index);}
 function navigate(direction){let next=frame+direction;if(next>=0&&next<collections[place].length){showFrame(next);return;}const destinationIndex=destinations.indexOf(place)+direction;if(destinationIndex>=0&&destinationIndex<destinations.length){const nextPlace=destinations[destinationIndex];selectPlace(nextPlace,direction>0?0:collections[nextPlace].length-1);}}
 destinations.forEach(name=>{const b=document.createElement('button');b.type='button';b.dataset.place=name;b.textContent=name;b.onclick=()=>selectPlace(name);places.append(b);});
 camera.querySelector('.camera-prev').onclick=()=>navigate(-1);camera.querySelector('.camera-next').onclick=()=>navigate(1);window.funNavigate=navigate;selectPlace(destinations[0]);
}

/* CONTACT: five-question Spotify personality quiz. Results are from Angie's playlist. */
function renderContactGame(grid){
 $('folderHeading').textContent='CONTACT ME.';
 $('folderDescription').textContent='Want to get in touch? I’d love to hear from you. And while you’re here, find out which song from my playlist matches your personality.';
 $('folderFootnote').textContent='A LITTLE PIECE OF MY PLAYLIST, FOR YOU';
 const tracks=[
  {name:'Ordinary',artist:'Alex Warren',vibe:'The wholehearted one',desc:'You make ordinary moments feel like the best memories. You care deeply and never do things halfway.',search:'Ordinary Alex Warren'},
  {name:'Lover',artist:'Taylor Swift',vibe:'The soft-hearted one',desc:'You love the little things: long conversations, familiar places, and people who feel like home.',search:'Lover Taylor Swift'},
  {name:'DtMF',artist:'Bad Bunny',vibe:'The nostalgic one',desc:'You live for the moment, but you always wish you had taken one more photo. Every memory means something.',search:'DtMF Bad Bunny'},
  {name:'NUEVAYoL',artist:'Bad Bunny',vibe:'The life-of-the-party one',desc:'You bring energy everywhere you go. Your best plans are the ones that happen last minute.',search:'NUEVAYoL Bad Bunny'},
  {name:'Die With A Smile',artist:'Lady Gaga & Bruno Mars',vibe:'The all-in one',desc:'You are loyal, expressive, and a little dramatic in the best way. You make people feel important.',search:'Die With A Smile Lady Gaga Bruno Mars'},
  {name:'Alive',artist:'Empire of the Sun',vibe:'The dreamer',desc:'You are always chasing the next adventure, a new idea, or a feeling you cannot quite put into words.',search:'Alive Empire of the Sun'}
 ];
 const questions=[
  {q:'Your ideal Friday night?',a:[['Dinner with my favorite people',[1,4]],['Going out with no plans to go home early',[3]],['A spontaneous trip somewhere new',[5,3]],['Staying in and replaying memories',[2,0]]]},
  {q:'Pick a camera-roll folder.',a:[['Blurry photos of everyone laughing',[2,3]],['Sunsets and places I want to revisit',[5,2]],['Little everyday moments',[0,1]],['Photos with my favorite person',[4,1]]]},
  {q:'Your friends would call you...',a:[['The sentimental one',[2,1]],['The one who starts the plans',[3,5]],['The hopeless romantic',[4,1]],['The one who makes everything fun',[0,3]]]},
  {q:'Choose your soundtrack mood.',a:[['Dreamy and cinematic',[5]],['Loud and full of energy',[3]],['Sweet and emotional',[1,4]],['A little nostalgic',[2,0]]]},
  {q:'What would you rather collect?',a:[['Passport stamps',[5,3]],['Old photos',[2]],['Handwritten notes',[1,4]],['Stories I can tell forever',[0,2]]]}
 ];
 let step=0;let scores=tracks.map(()=>0);let choices=[];
 grid.innerHTML=`<section class="song-quiz"><div class="quiz-intro"><span>JUST FOR FUN / MY PLAYLIST</span><h4>WHAT SONG ARE YOU?</h4><p>Five questions. One song from my Spotify playlist.</p></div><div class="quiz-top"><span>ANGIE ON RECORD / PERSONALITY TEST</span><span class="quiz-progress-text">01 / 05</span></div><div class="quiz-meter"><span></span></div><div class="quiz-body" aria-live="polite"></div><div class="quiz-bottom"><span>FROM MY TOP SONGS 2025</span><button class="quiz-back" type="button">← BACK</button></div><div class="quiz-contact"><div><span>LET’S KEEP IN TOUCH</span><h4>Have something in mind?</h4><p>Whether it’s a project, an opportunity or just a hello, I’d love to hear from you.</p></div><a href="mailto:angielevy24@gmail.com?subject=Hello%20Angie%20-%20Angie%20On%20Record" aria-label="Email Angie at angielevy24@gmail.com">SEND ME AN EMAIL ↗</a><small class="quiz-email-address">TO: angielevy24@gmail.com</small></div></section>`;
 const root=grid.querySelector('.song-quiz'),body=root.querySelector('.quiz-body'),meter=root.querySelector('.quiz-meter span'),progress=root.querySelector('.quiz-progress-text'),back=root.querySelector('.quiz-back');
 function render(){
  progress.textContent=step<5?String(step+1).padStart(2,'0')+' / 05':'YOUR RESULT';meter.style.width=(step<5?(step/5*100):100)+'%';back.hidden=step===0;
  if(step===5){let best=0;tracks.forEach((t,i)=>{if(scores[i]>scores[best])best=i;});const t=tracks[best];const spotify='https://open.spotify.com/search/'+encodeURIComponent(t.search);body.innerHTML=`<div class="quiz-result"><div class="quiz-record-area"><div class="quiz-record"><div class="quiz-record-label">ANGIE<br>ON RECORD<small>YOUR SONG</small></div></div></div><div class="quiz-result-copy"><span class="quiz-eyebrow">THE RECORD HAS SPOKEN</span><h4>${t.name}</h4><p class="quiz-artist">${t.artist}</p><strong>${t.vibe}</strong><p>${t.desc}</p><div class="quiz-actions"><a class="quiz-listen" target="_blank" rel="noopener noreferrer" href="${spotify}">LISTEN ON SPOTIFY ↗</a><button class="quiz-again" type="button">PLAY AGAIN ↻</button></div><p class="quiz-foot">Want to share your result? You can email me below!</p></div></div>`;body.querySelector('.quiz-again').onclick=()=>{step=0;scores=tracks.map(()=>0);choices=[];render();};return;}
  const q=questions[step];body.innerHTML=`<div class="quiz-question"><span class="quiz-eyebrow">QUESTION ${String(step+1).padStart(2,'0')} / FIVE</span><h4>${q.q}</h4><div class="quiz-options"></div></div>`;const opts=body.querySelector('.quiz-options');q.a.forEach(([label,ids],i)=>{const btn=document.createElement('button');btn.type='button';btn.className='quiz-option';btn.innerHTML='<span class="quiz-letter">'+String.fromCharCode(65+i)+'</span><span></span><span class="quiz-option-arrow">↗</span>';btn.children[1].textContent=label;btn.onclick=()=>{choices[step]=ids;ids.forEach(id=>scores[id]++);step++;render();};opts.append(btn);});
 }
 back.onclick=()=>{if(step===0)return;step--;scores=tracks.map(()=>0);choices.slice(0,step).forEach(ids=>ids.forEach(id=>scores[id]++));choices=choices.slice(0,step);render();};render();
}

function closeFolder(){
 // Closing any sleeve stops and rewinds its audio and forgets the last viewed content.
 sleevePhotoIndex=0;window.funNavigate=null;window.contactNavigate=null;
 closeGalleryInside();
 closeOnSet();
 $('gatefold').classList.remove('visible');
 $('gatefold').setAttribute('aria-hidden','true');
 if(playing) setPlaying(false);
 else stopMusic();
 needleDown=false;
 $('tonearm').classList.remove('engaged');
 $('tonearm').setAttribute('aria-valuenow','0');
 if(loaded>=0 && opened){$('dragHint').classList.add('visible');setStep(3);}
}
/* 09. HARDWARE CONTROLS: pitch = volume, power = reset, speed and adapter = RPM, cue = lift, anti-skate = auto-return, lamp = cue light. */
function reset(){
 // The physical POWER button resets the loaded record but keeps the player open.
 if(loading){loadGeneration++;loading=false;}
 closeFolder();setPlaying(false);loaded=-1;selected=0;choose(0);
 $('record').classList.remove('loaded');updateNowPlaying();
 $('dragHint').classList.remove('visible');$('deckStatus').textContent='STANDBY';
 $('albumObject').className='album-object';cueLifted=false;needleDown=false;
 $('cueIcon').textContent='↑';tonearm.classList.remove('engaged');
 $('trackingFill').style.width='0%';
 toast('Player reset. Choose a new record.');
 message('SELECT A COVER, THEN LOAD THE RECORD');setStep(2);
}
/* HOME: a separate small button returns to the closed-lid introduction. */
function resetToEntrance(){
 if(loading){loadGeneration++;loading=false;}
 closeFolder();setPlaying(false);loaded=-1;selected=0;
 $('game').classList.remove('opened','centering-player','opening-lid');opened=false;$('openButton').disabled=false;
 $('intro').setAttribute('aria-hidden','false');
 $('albumObject').className='album-object';
 $('record').classList.remove('loaded','spinning','fast');
 $('dragHint').classList.remove('visible');
 $('deckStatus').textContent='STANDBY';
 $('trackingFill').style.width='0%';
 $('tonearm').classList.remove('engaged');
 $('tonearm').style.transform='';
 $('tonearm').setAttribute('aria-valuenow','0');
 cueLifted=false;needleDown=false;$('cueIcon').textContent='↑';
 choose(0,false);$('rackViewport').scrollLeft=0;
 updateNowPlaying();setStep(1);
}

function toggleSpeed(){speed=speed===33?45:33;$('speedReadout').textContent=speed===33?'33⅓':'45';$('record').classList.toggle('fast',speed===45);if(playing)startMusic();toast('Speed: '+(speed===33?'33⅓':'45')+' RPM');}
function toggleCue(){cueLifted=!cueLifted;$('cueIcon').textContent=cueLifted?'↓':'↑';if(cueLifted&&playing)setPlaying(false);toast(cueLifted?'Needle lifted — audio paused':'Cue lever lowered — drag needle to play');}
function toggleAntiSkate(){autoReturn=!autoReturn;$('antiSkateButton').style.color=autoReturn?'#932c3a':'#333';toast('Auto-return '+(autoReturn?'ON':'OFF'));}
function toggleLamp(){lampOn=!lampOn;$('deck').classList.toggle('cue-lit',lampOn);toast('Cue lamp '+(lampOn?'ON':'OFF'));}
/* The bottom website navigation was removed; short messages now live in the red game prompt. */
function message(s){const el=$('gamePrompt');el.title=s;}
function toast(s){const el=$('toast');el.textContent=s;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2500);}
/* 10. EVENT WIRING: all visible buttons have a working, explicit action. */
$('homeResetButton').addEventListener('click',resetToEntrance);$('openButton').addEventListener('click',openPlayer);$('lid').addEventListener('click',openPlayer);/* Browse only: arrows never load a record or interrupt the music. */$('prevAlbum').addEventListener('click',()=>choose(selected-1));$('nextAlbum').addEventListener('click',()=>choose(selected+1));$('rackSlider').addEventListener('input',e=>choose(Number(e.target.value)));$('rackViewport').addEventListener('scroll',()=>{const vp=$('rackViewport');const max=vp.scrollWidth-vp.clientWidth;if(max>1){const index=Math.round(vp.scrollLeft/max*(albums.length-1));if(index!==selected)choose(index,false);}});/* Moving the discovery slider changes only the highlighted sleeve. */$('record').addEventListener('click',()=>{if(loaded>=0&&!playing)needlePlay();});$('powerButton').addEventListener('click',reset);$('speedButton').addEventListener('click',toggleSpeed);$('adapterButton').addEventListener('click',()=>{if(speed!==45)toggleSpeed();else toast('45 RPM adapter is already active');});$('cueButton').addEventListener('click',toggleCue);$('antiSkateButton').addEventListener('click',toggleAntiSkate);$('lampButton').addEventListener('click',toggleLamp);$('pitchSlider').addEventListener('input',()=>{updateVolume();message('VOLUME '+Math.round(volume*100)+'%');});$('closeFolder').addEventListener('click',closeFolder);// Clicking outside the sleeve does not close it: only CLOSE, Escape or reset does.
$('nextFromFolder').addEventListener('click',closeFolder);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFolder();});
/* 11. INITIALIZATION: build covers and set the hardware to its starting position. */
buildRack();updateVolume();$('antiSkateButton').style.color='#932c3a';

/* 12. CONTEXTUAL RED GUIDANCE: each step highlights the real object the player must use.
   No floating instruction box and no duplicate navigation buttons are necessary. */
let currentStep=1;
const steps={
  1:'CLICK OPEN THE PLAYER',
  2:'CHOOSE AN ALBUM ABOVE',
  3:'DRAG THE NEEDLE TO PLAY',
  4:'EXPLORE YOUR RECORD SLEEVE'
};
function setStep(number){
  currentStep=number;
  $('stepCounter').textContent=String(number).padStart(2,'0')+' / 04';
  $('stepTitle').textContent=steps[number];
  $('game').dataset.step=String(number);
  $('gamePrompt').classList.toggle('behind-folder',number===4);
}
/* Closing the album returns the highlight to the needle or record browser. */
const originalCloseFolder=closeFolder;
closeFolder=function(){originalCloseFolder();if(loaded>=0&&!loading)setStep(playing?3:3);};
/* When a record is selected, the red highlight moves to the actual tonearm. */
setStep(1);

/* 13. THE GALLERY ONLY: custom video/photo viewer based on the earlier film-strip layout.
   This does not change the turntable, record loading, other sleeves or audio controls. */
const galleryProjects=[
 {title:'Slice of Life — Brela',category:'DOCUMENTARY / GROUP WORK',text:'A group project for IE University about Brela, a bakery in Madrid. We followed the production process, filmed interviews and captured the details that make the place special. Group members: Angie Levy, Jimena Berecochea, Renata Abaroa, Anika Niemann, Valentina Cacho, Federica Yanes and Julieta Vaca Diez.',items:[{kind:'photo',src:'brela.jpg'},{kind:'photo',src:'brela_behind_scenes.jpg'},{kind:'video',src:'brela_clip.mp4',title:'Behind the scenes at Brela',silent:true},{kind:'video',src:'https://drive.google.com/file/d/1P98yQs0I2l58uUYiTqTblIdRtmuPpJIP/preview',title:'Slice of Life — Brela · Final documentary',driveEmbed:true}]},
 {title:'Lucky Latin!',category:'BOARD GAME / GROUP PROJECT',text:'A group project for IE University: a Latin American bingo game celebrating the places, details and everyday moments that feel like home. From the packaging to the cards, we designed and tested it together. Group members: Angie Levy, Jimena Berecochea, Renata Abaroa, Anika Niemann, Valentina Cacho, Federica Yanes and Julieta Vaca Diez.',items:[{kind:'photo',src:'lucky_box.jpg'},{kind:'photo',src:'lucky_cards.jpg'},{kind:'photo',src:'lucky_playing.jpg'}]},
 {title:'Háblalo Einstein',category:'PODCAST / HOST',text:'The podcast I co-hosted with Leeya Etaat at Instituto Alberto Einstein in Panama. Each episode starts with a conversation and a story worth sharing.',items:[{kind:'video',src:'podcast-piloto.mp4',title:'01 · Episodio Piloto'},{kind:'video',src:'podcast-dia-del-padre.mp4',title:'02 · Día del Padre'},{kind:'video',src:'podcast-vacaciones.mp4',title:'03 · Vacaciones'},{kind:'video',src:'podcast-ep5.mp4',title:'05 · Episodio 5'}]}
];
let galleryProjectIndex=0,galleryMediaIndex=0;
// Stop and rewind any playing episode before its player is removed.
function stopGalleryVideo(){
 const screen=$('galleryScreenContent');
 screen.querySelectorAll('video').forEach(video=>{
  video.pause();
  try{video.currentTime=0;}catch(e){}
  video.removeAttribute('src');
  video.load();
 });
 screen.querySelectorAll('iframe').forEach(frame=>{frame.src='about:blank';});
 screen.replaceChildren();
}

function openGalleryInside(){
 // Start from Brela and its first photo every time the Gallery sleeve opens.
 galleryProjectIndex=0;
 galleryMediaIndex=0;
 $('galleryInside').hidden=false;$('gatefold').classList.add('gallery-mode');
 renderGalleryTabs();renderGallery();
}
function closeGalleryInside(){
 // Forget the last viewed project when the sleeve closes.
 galleryProjectIndex=0;
 galleryMediaIndex=0;
 $('galleryInside').hidden=true;$('gatefold').classList.remove('gallery-mode');
 // Removing the video element stops playback when the sleeve closes.
 stopGalleryVideo();
}
function renderGalleryTabs(){
 const nav=$('galleryTabs');nav.replaceChildren();
 galleryProjects.forEach((project,i)=>{
  const button=document.createElement('button');button.type='button';button.className='gallery-tab';
  const thumb=project.items.find(item=>item.kind==='photo');
  if(thumb){const img=document.createElement('img');img.src='assets/'+thumb.src;img.alt='';button.append(img);}
  else{const img=document.createElement('img');img.src='assets/podcast-episode2-preview.jpg';img.alt='Episode 2 preview';button.append(img);}
  const words=document.createElement('span');words.innerHTML='<small>'+String(i+1).padStart(2,'0')+'</small><strong></strong>';words.querySelector('strong').textContent=project.title;button.append(words);
  button.addEventListener('click',()=>selectGalleryProject(i));nav.append(button);
 });
}
function selectGalleryProject(i){stopGalleryVideo();galleryProjectIndex=(i+galleryProjects.length)%galleryProjects.length;galleryMediaIndex=0;if(galleryProjectIndex!==2)resumeAfterPodcast();renderGallery();}
function selectGalleryMedia(i){
 stopGalleryVideo();const count=galleryProjects[galleryProjectIndex].items.length;
 if(i>=count){galleryProjectIndex=(galleryProjectIndex+1)%galleryProjects.length;galleryMediaIndex=0;renderGalleryTabs();}
 else if(i<0){galleryProjectIndex=(galleryProjectIndex-1+galleryProjects.length)%galleryProjects.length;galleryMediaIndex=galleryProjects[galleryProjectIndex].items.length-1;renderGalleryTabs();}
 else galleryMediaIndex=i;
 // Resume the soundtrack when leaving a playing video, without resetting its position.
 if(galleryProjectIndex!==2 || galleryProjects[galleryProjectIndex].items[galleryMediaIndex].kind!=='video' || galleryProjects[galleryProjectIndex].items[galleryMediaIndex].silent)resumeAfterPodcast();
 renderGallery();
}
function renderGallery(){
 const project=galleryProjects[galleryProjectIndex],item=project.items[galleryMediaIndex],n=project.items.length;
 document.querySelectorAll('.gallery-tab').forEach((button,i)=>{button.classList.toggle('active',i===galleryProjectIndex);button.setAttribute('aria-current',i===galleryProjectIndex?'true':'false');});
 $('galleryCategory').textContent=project.category;$('galleryProjectTitle').textContent=project.title;$('galleryProjectText').textContent=project.text;
 $('galleryMediaType').textContent=(item.kind==='video'?'VIDEO':'PHOTO')+' · '+String(galleryMediaIndex+1).padStart(2,'0')+'/'+String(n).padStart(2,'0');
 $('galleryArchiveTitle').textContent=project.title;
 $('galleryFrameCount').textContent=String(galleryMediaIndex+1).padStart(2,'0')+' / '+String(n).padStart(2,'0');
 $('galleryProgressFill').style.width=((galleryMediaIndex+1)/n*100)+'%';
 const screen=$('galleryScreenContent');stopGalleryVideo();
 if(item.kind==='video' && item.driveEmbed){
  // Google Drive final documentary: load only when the visitor presses play.
  // This avoids a large GitHub upload and keeps the existing gallery layout.
  const mat=document.createElement('div');mat.className='gallery-video-mat brela-final-video';
  const start=document.createElement('button');start.type='button';start.className='brela-final-play';start.setAttribute('aria-label','Play the final Brela documentary');
  start.innerHTML='<img src="assets/brela_video_preview.jpg" alt=""><span>▶ WATCH FINAL DOCUMENTARY</span>';
  start.addEventListener('click',()=>{
    pauseForPodcast();
    const frame=document.createElement('iframe');frame.src=item.src;frame.title=item.title;
    frame.allow='autoplay; fullscreen; picture-in-picture';frame.allowFullscreen=true;
    frame.style.cssText='width:100%;height:100%;border:0';mat.replaceChildren(frame);
  });
  mat.append(start);screen.append(mat);
 }else if(item.kind==='video' && item.embed){const mat=document.createElement('div');mat.className='gallery-video-mat';const frame=document.createElement('iframe');frame.src=item.src+'?rel=0&playsinline=1';frame.title=item.title;frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';frame.allowFullscreen=true;frame.style.cssText='width:100%;height:100%;border:0';mat.append(frame);screen.append(mat);
 }else if(item.kind==='video'){
  // Local MP4 episodes in chronological order; no YouTube embed required.
  const video=document.createElement('video');video.src='assets/'+item.src;video.controls=true;video.preload='metadata';video.playsInline=true;if(item.silent){video.muted=true;video.defaultMuted=true;video.autoplay=true;video.loop=true;video.setAttribute('muted','');video.setAttribute('autoplay','');video.setAttribute('loop','');}video.setAttribute('playsinline','');video.setAttribute('aria-label',item.title);if(!item.silent)video.addEventListener('play',pauseForPodcast);video.addEventListener('error',()=>{const note=document.createElement('p');note.className='video-file-error';note.textContent='Video unavailable in this browser.';screen.append(note);});const mat=document.createElement('div');mat.className='gallery-video-mat';mat.append(video);
  // Episode title sits inside the monitor, like a subtle YouTube title overlay.
  if(!item.silent && galleryProjectIndex===2){
   const episodeTitle=document.createElement('div');episodeTitle.className='gallery-episode-overlay';
   episodeTitle.textContent=item.title;mat.append(episodeTitle);
  }
  screen.append(mat);if(item.silent)video.play().catch(()=>{});
 }else{
  const mat=document.createElement('div');mat.className='gallery-photo-mat';const img=document.createElement('img');img.src='assets/'+item.src;img.alt=project.title+' photo '+(galleryMediaIndex+1);mat.append(img);screen.append(mat);
 }
 const thumbs=$('galleryThumbs');thumbs.replaceChildren();project.items.forEach((entry,i)=>{
  const button=document.createElement('button');button.type='button';button.className='gallery-thumb'+(i===galleryMediaIndex?' active':'');button.setAttribute('aria-label','View '+(entry.kind==='video'?'episode ':'photo ')+(i+1));
  if(entry.kind==='photo'){const image=document.createElement('img');image.src='assets/'+entry.src;image.alt='';button.append(image);}
  else if(entry.silent || entry.driveEmbed){const preview=document.createElement('img');preview.src='assets/brela_video_preview.jpg';preview.alt=entry.title||'Brela video preview';button.append(preview);}else{const label=document.createElement('span');label.textContent=(['▶ PILOTO','▶ EPISODIO 2','▶ EPISODIO 3','▶ EPISODIO 5'][i] || ('▶ EP '+String(i+1).padStart(2,'0')));button.append(label);}
  button.addEventListener('click',()=>selectGalleryMedia(i));thumbs.append(button);
 });
 const extra=$('galleryExtra');extra.replaceChildren();
}
$('galleryPrevMedia').addEventListener('click',()=>selectGalleryMedia(galleryMediaIndex-1));
$('galleryNextMedia').addEventListener('click',()=>selectGalleryMedia(galleryMediaIndex+1));
$('galleryClose').addEventListener('click',closeFolder);
document.addEventListener('keydown',event=>{
 if($('galleryInside').hidden||!$('gatefold').classList.contains('visible'))return;
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
 // Left and right move through every gallery item, then the next project.
 if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();event.stopPropagation();selectGalleryMedia(galleryMediaIndex+(event.key==='ArrowRight'?1:-1));}
 // Up and down move through photos or episodes within the selected project.
 if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();event.stopPropagation();selectGalleryMedia(galleryMediaIndex+(event.key==='ArrowDown'?1:-1));}
});

/* SLEEVE PHOTO NAVIGATION: arrow keys browse the open album without stopping audio.
   The Gallery has its own separate arrow navigation above. */
document.addEventListener('keydown',event=>{
 if(!$('gatefold').classList.contains('visible') || !$('galleryInside').hidden) return;
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
 if(event.key!=='ArrowRight' && event.key!=='ArrowLeft') return;
 if(loaded===0 && typeof window.storyMemoryNavigate==='function'){event.preventDefault();event.stopPropagation();window.storyMemoryNavigate(event.key==='ArrowRight'?1:-1);return;}
 if(loaded===1 && !$('onsetRoom').hidden){event.preventDefault();event.stopPropagation();navigateOnSet(event.key==='ArrowRight'?1:-1);return;}
 if(loaded===3 && typeof window.funNavigate==='function'){event.preventDefault();event.stopPropagation();window.funNavigate(event.key==='ArrowRight'?1:-1);return;}
 if(loaded===4 && typeof window.contactNavigate==='function'){event.preventDefault();event.stopPropagation();window.contactNavigate(event.key==='ArrowRight'?1:-1);return;}
 event.preventDefault();
 event.stopPropagation();
 const album=albums[loaded];
 if(!album || !album.photos || !album.photos.length) return;
 sleevePhotoIndex=(sleevePhotoIndex+(event.key==='ArrowRight'?1:-1)+album.photos.length)%album.photos.length;
 $('folderImage').src='assets/'+album.photos[sleevePhotoIndex];
});

/* TEMPORARY COVER FLASH: briefly marks the record when its sleeve opens. */
function flashSelectedCover(){
 const cover=document.querySelectorAll('.sleeve')[loaded];
 if(!cover) return;
 cover.classList.remove('just-opened');
 void cover.offsetWidth;
 cover.classList.add('just-opened');
 setTimeout(()=>cover.classList.remove('just-opened'),850);
}
const originalOpenFolderV19=openFolder;
openFolder=function(){originalOpenFolderV19();flashSelectedCover();};

// Keep the original Now Playing display in sync with the physical turntable.
// The red light turns on only while the record is actually playing.
function updateNowPlaying(){
  const panel=$('nowPlaying');
  const title=$('nowPlayingTitle');
  if(!panel||!title)return;
  /* Show the current song and artist, or the album title when no song is assigned. */
  title.textContent=loaded>=0?(albums[loaded].track?albums[loaded].track.toUpperCase()+' — '+albums[loaded].artist.toUpperCase():albums[loaded].title.toUpperCase()):'NOTHING YET';
  panel.classList.toggle('is-playing',playing&&!galleryAudioPaused);
  panel.title=galleryAudioPaused?'Paused for podcast playback':'';
}

/* MY STORY: interactive memory-book, independent from the other four sleeves. */
const storyChapters=[
 {name:'01 / THE BEGINNING',tag:'PANAMA · LITTLE ME',title:'Before the big ideas',copy:'I grew up in Panama, always curious, always surrounded by stories. These are some of my earliest memories.',photos:[16,18,21,19]},
 {name:'02 / GROWING UP',tag:'SCHOOL DAYS · MACABI',title:'The people who grew with me',copy:'School, friendships, leadership and Macabi became a big part of who I am. So many of my favorite memories started here.',photos:[6,2,4,7,8,11]},
 {name:'03 / THE NEXT CHAPTER',tag:'SENIORS 24 · GRADUATION',title:'One chapter ends, another begins',copy:'From childhood friends to our last school year, graduating felt like closing a chapter I would always want to replay.',photos:[0,20]},
 {name:'04 / MADRID DIARIES',tag:'IE UNIVERSITY · NEW BEGINNINGS',title:'A new city, new memories',copy:'Moving from Panama to Madrid to study Communication and Digital Media at IE University has been a new adventure, with new people and new stories.',photos:[13,14,15]}
];
function renderStoryMemoryBook(grid){
 window.storyMemoryNavigate=null;
 grid.replaceChildren();grid.classList.add('story-memory-grid');
 const book=document.createElement('section');book.className='story-book';
 book.innerHTML='<div class="story-book-top"><span>THE MEMORY BOOK</span><span>PANAMA → MADRID</span></div><div class="story-chapters" role="tablist" aria-label="Story chapters"></div><div class="story-spread"><div class="story-feature"><img alt="A memory from Angie’s story"><span class="story-stamp">A MOMENT IN TIME</span></div><div class="story-caption"><span class="story-eyebrow"></span><h4></h4><p></p><div class="story-counter"></div></div></div><div class="story-filmstrip" aria-label="Photos from this chapter"></div><div class="story-book-foot">A COLLECTION OF LITTLE MOMENTS <span>USE ← → TO EXPLORE</span></div>';
 grid.append(book);
 const chapters=book.querySelector('.story-chapters'),strip=book.querySelector('.story-filmstrip');let chapter=0,photo=0;
 // Keyboard controls only the memory book while My Story is open.
 window.storyMemoryNavigate=(direction)=>{const count=storyChapters[chapter].photos.length;const next=photo+direction;if(next>=count){chapter=(chapter+1)%storyChapters.length;photo=0;}else if(next<0){chapter=(chapter-1+storyChapters.length)%storyChapters.length;photo=storyChapters[chapter].photos.length-1;}else{photo=next;}render();};
 function render(){const c=storyChapters[chapter];chapters.replaceChildren();storyChapters.forEach((item,i)=>{const b=document.createElement('button');b.type='button';b.className=i===chapter?'active':'';b.textContent=item.name;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(i===chapter));b.onclick=()=>{chapter=i;photo=0;render()};chapters.append(b)});
 const feature=book.querySelector('.story-feature img');feature.src='assets/story_'+c.photos[photo]+'.jpg';feature.alt=c.tag+' memory photo '+(photo+1);book.querySelector('.story-eyebrow').textContent=c.tag;book.querySelector('.story-caption h4').textContent=c.title;book.querySelector('.story-caption p').textContent=c.copy;book.querySelector('.story-counter').textContent='PHOTO '+String(photo+1).padStart(2,'0')+' / '+String(c.photos.length).padStart(2,'0');book.querySelector('.story-stamp').textContent='MOMENT '+String(photo+1).padStart(2,'0');strip.replaceChildren();c.photos.forEach((id,i)=>{const b=document.createElement('button');b.type='button';b.className=i===photo?'active':'';b.setAttribute('aria-label','Show memory '+(i+1));const im=document.createElement('img');im.src='assets/story_'+id+'.jpg';im.alt='';b.append(im);b.onclick=()=>{photo=i;render()};strip.append(b)});}
 render();
}

/* ON SET: all media is user-supplied. No fake footage or invented brand work. */
const onSetCollections={
 calle:{name:'MEDCOM · CALLE 7',copy:'At Medcom, I worked in the Calle 7 production area, supporting scripts, the control room, scouting and the live TV production process.',feeds:[{kind:'image',src:'onset_control_room.jpg',label:'THE CONTROL ROOM'},...Array.from({length:7},(_,i)=>({kind:'video',src:`onset_calle_${i+1}.mp4`,label:`CALLE 7 / CLIP ${String(i+1).padStart(2,'0')}`}))]},
 joint:{name:'JOINT CREATIVO',copy:'Creative agency work across campaigns and clients. These four published Instagram pieces were created for Multiplaza. I also worked with Miniso, BMW, MINI Cooper and Athens Pizza. Toy o No Toy was another part of my production experience, working from the same offices and with the same supervisor.',feeds:[{kind:'image',src:'onset_joint_office.jpg',label:'AT THE AGENCY'},{kind:'image',src:'onset_coworkers.jpg',label:'THE TEAM'},...Array.from({length:4},(_,i)=>({kind:'video',src:`onset_joint_${i+1}.mp4`,label:`MULTIPLAZA / POST ${String(i+1).padStart(2,'0')}`}))]},
 toy:{name:'TOY O NO TOY',copy:'TV promotions and sponsor content, including work for PedidosYa. This experience was connected to my work at Joint Creativo, in the same offices and with the same supervisor.',feeds:[{kind:'image',src:'onset_joint_office.jpg',label:'SHARED CREATIVE SPACE'},{kind:'image',src:'onset_coworkers.jpg',label:'THE TEAM'}]}
};
let onSetActive='calle',onSetFeed=0;
function onSetStopVideos(){document.querySelectorAll('#onsetRoom video').forEach(v=>{v.pause();v.removeAttribute('src');v.load();});}
function onSetMedia(feed,autoplay=false){let el;if(feed.kind==='video'&&autoplay){el=document.createElement('video');el.src='assets/'+feed.src;el.poster='assets/'+feed.src.replace('.mp4','_preview.jpg');el.muted=true;el.defaultMuted=true;el.volume=0;el.setAttribute('muted','');el.addEventListener('volumechange',()=>{if(!el.muted||el.volume!==0){el.muted=true;el.volume=0;}});el.playsInline=true;el.loop=true;el.controls=false;el.preload='metadata';el.play().catch(()=>{});}else{el=document.createElement('img');el.src='assets/'+(feed.kind==='video'?feed.src.replace('.mp4','_preview.jpg'):feed.src);el.alt=feed.label;}return el;}
function showOnSetFeed(i){const collection=onSetCollections[onSetActive];onSetFeed=(i+collection.feeds.length)%collection.feeds.length;onSetStopVideos();const feed=collection.feeds[onSetFeed],screen=$('onsetMainFeed');screen.replaceChildren(onSetMedia(feed,true));$('onsetCounter').textContent='CAM '+String(onSetFeed+1).padStart(2,'0');$('onsetFeedLabel').textContent=feed.label;document.querySelectorAll('.onset-cam').forEach((el,n)=>el.classList.toggle('active',n===onSetFeed));}
function navigateOnSet(direction){const order=['calle','joint'];const feeds=onSetCollections[onSetActive].feeds;const next=onSetFeed+direction;if(next>=feeds.length){switchOnSet(order[(order.indexOf(onSetActive)+1)%order.length]);}else if(next<0){const previous=order[(order.indexOf(onSetActive)-1+order.length)%order.length];switchOnSet(previous);showOnSetFeed(onSetCollections[previous].feeds.length-1);}else{showOnSetFeed(next);}}
function switchOnSet(key){onSetActive=key;onSetStopVideos();const col=onSetCollections[key];$('onsetProgram').textContent=col.name;$('onsetSideCopy').innerHTML=`<strong>${col.name}</strong><p>${col.copy}</p>${key==='joint'?'<div class="onset-roster"><small>OTHER CLIENTS / NO MEDIA ARCHIVE</small><span>MINISO</span><span>BMW</span><span>MINI COOPER</span><span>ATHENS PIZZA</span></div>':''}`;const multi=$('onsetMultiview');multi.replaceChildren();col.feeds.forEach((feed,i)=>{const b=document.createElement('button');b.type='button';b.className='onset-cam';const preview=onSetMedia(feed,false);b.append(preview);const cap=document.createElement('span');cap.textContent=`CAM ${String(i+1).padStart(2,'0')} · ${feed.label}`;b.append(cap);b.onclick=()=>showOnSetFeed(i);multi.append(b);});document.querySelectorAll('[data-production]').forEach(b=>b.classList.toggle('active',b.dataset.production===key));showOnSetFeed(0);}
function openOnSet(){$('onsetRoom').hidden=false;$('gatefold').classList.add('onset-mode');switchOnSet('calle');}
function closeOnSet(){onSetStopVideos();$('onsetRoom').hidden=true;$('gatefold').classList.remove('onset-mode');}
document.querySelectorAll('[data-production]').forEach(b=>b.addEventListener('click',()=>switchOnSet(b.dataset.production)));
$('onsetClose').addEventListener('click',()=>{closeOnSet();closeFolder();});

$('onsetPrevious').addEventListener('click',()=>navigateOnSet(-1));
$('onsetNext').addEventListener('click',()=>navigateOnSet(1));
