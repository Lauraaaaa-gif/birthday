'use strict';
// 在這裡修改最後的祝福文字。文字以 textContent 顯示，可安心輸入標點。
const BIRTHDAY_MESSAGE = '願你每一歲都能做喜歡的事，身邊都是喜歡的人。今天的快樂是你的，以後的每一天也是。';
const $ = (selector) => document.querySelector(selector);
const screen = $('#screen');
let stage = 0, escapes = 0, answered = false, soundOn = false, audioContext;
let toastTimer, cakeState = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const music = $('#birthday-music');
const musicToggle = $('#music-toggle');
music.volume = .38;
function updateMusicButton() {
  const playing = !music.paused;
  musicToggle.textContent = playing ? '♫' : '♫ ×';
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicToggle.setAttribute('aria-label', playing ? '暫停音樂' : '播放音樂');
}
function startMusic() {
  musicToggle.hidden = false;
  music.play().then(updateMusicButton).catch(() => {
    updateMusicButton(); toast('點左下角 ♫ 開啟音樂');
  });
}
musicToggle.onclick = () => {
  if (music.paused) startMusic();
  else { music.pause(); updateMusicButton(); }
};
music.addEventListener('play', updateMusicButton);
music.addEventListener('pause', updateMusicButton);

function tone(frequency = 660, duration = .12) {
  if (!soundOn) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.frequency.value = frequency; oscillator.type = 'sine';
    gain.gain.setValueAtTime(.06, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  } catch { /* 音效不支援時仍可正常闖關。 */ }
}
function toast(message) {
  clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2800);
}
function shake() {
  $('#card').classList.remove('shake'); void $('#card').offsetWidth; $('#card').classList.add('shake');
  if (!reducedMotion && navigator.vibrate) navigator.vibrate([70, 40, 70]);
  tone(160, .2);
}
function feedback(message, error = false) {
  $('#feedback').textContent = message; $('#feedback').classList.toggle('error', error);
}
function render(markup) {
  screen.innerHTML = markup; screen.classList.remove('screen-enter'); void screen.offsetWidth; screen.classList.add('screen-enter');
  const heading = $('#screen-title'); heading.tabIndex = -1; heading.focus({ preventScroll: true });
}
function intro() {
  stage = 0; escapes = 0; answered = false; cakeState = 0;
  document.querySelector('.runaway')?.remove();
  document.body.classList.remove('party'); $('#particles').replaceChildren();
  $('#toast').classList.remove('visible'); clearTimeout(toastTimer);
  render(`<section class="xp-dialog" aria-labelledby="screen-title"><div class="xp-title"><span>系統警告</span><button class="xp-close" id="close" aria-label="關閉">×</button></div><div class="xp-content"><div class="xp-message"><span class="xp-error" aria-hidden="true">×</span><div><h1 id="screen-title">你的手機現在被我盜了</h1><p>想要奪回手機控制權，就必須完成以下題目。</p></div></div><div class="xp-actions"><button id="start">開始回答</button></div></div></section>`);
  $('#start').onclick = () => { startMusic(); question(1); };
  $('#close').onclick = () => { shake(); toast('關不掉啦，先回答問題！'); };
}
const questions = [null,
  { icon:'🕵️', title:'你現在幾歲？', subtitle:'請誠實作答。系統有自己的想法。', left:'18', right:'21' },
  { icon:'👀', title:'選我還是小孤獨？', subtitle:'這是一道送分題。應該……是吧？', left:'我', right:'小孤獨' },
  { icon:'🎃', title:'今天是什麼日子？', subtitle:'最後一道驗證，答案就在你心裡。', left:'生日', right:'萬聖節' }
];
function question(number) {
  stage = number; answered = false; escapes = 0;
  document.querySelector('.runaway')?.remove();
  const q = questions[number];
  render(`<h2 id="screen-title">${q.title}</h2><div class="choices"><button id="left" class="choice">${q.left}</button><button id="right" class="choice">${q.right}</button></div><div id="cry" hidden class="cry-panel"><span class="cry-face" role="img" aria-label="大哭表情">😭</span><strong>選我選我選我</strong></div><div id="feedback" class="feedback" role="status" aria-live="polite"></div><button id="next" class="primary" hidden>下一題</button>`);
  $('#left').onclick = () => correct();
  $('#right').onclick = () => {
    if (answered) return;
    if (stage === 1) { feedback('錯誤！21 是什麼？系統查無此年齡。再想一下！', true); shake(); }
    else if (stage === 2) escapeButton();
    else {
      feedback('正確！萬聖節快樂 🎃 也算你對，但是最重要的還是自己的生日。最後一題了可不能答錯啊！我還幫你留著按鈕，去按吧。');
      $('#right').textContent = '萬聖節快樂 🎃'; $('#right').disabled = true;
      tone(740); emojis('🎃');
    }
  };
  $('#next').onclick = () => question(stage + 1);
}
function correct() {
  if (answered) return; answered = true; tone(880, .2);
  if (stage === 3) { finale(); return; }
  $('#left').disabled = true; $('#right').disabled = true;
  $('#right').hidden = true; $('#cry').hidden = true;
  feedback(stage === 1 ? '答對了！因為你永遠 18 歲 ✨ 年齡已永久鎖定。' : '答對！果然我才是你的第一順位 💗（剛剛的事我就不計較了）');
  $('#next').hidden = false;
}
function viewportBounds() {
  const v = window.visualViewport;
  return { x: v?.offsetLeft || 0, y: v?.offsetTop || 0,
    width: v?.width || innerWidth, height: v?.height || innerHeight };
}
function escapeButton() {
  escapes++; shake();
  const button = $('#right');
  if (escapes >= 4) {
    button.hidden = true; $('#cry').hidden = false;
    feedback('選我！', true); $('#left').focus({ preventScroll:true }); return;
  }
  const previous = button.getBoundingClientRect();
  // 直接掛在 body，讓父層的晃動、大小或裁切不會限制逃跑範圍。
  if (button.parentElement !== document.body) {
    document.body.append(button); button.classList.add('runaway');
    button.style.left = previous.left + 'px'; button.style.top = previous.top + 'px';
  }
  const factor = [1, .82, .66, .5][escapes];
  const width = 156 * factor, height = 80 * factor;
  button.style.width = width + 'px'; button.style.height = height + 'px';
  button.style.fontSize = 30 * factor + 'px';
  const v = viewportBounds(), pad = 12;
  const maxX = Math.max(0, v.width - width - pad * 2);
  const maxY = Math.max(0, v.height - height - pad * 2);
  const left = $('#left').getBoundingClientRect();
  let position, best = -Infinity;
  for (let i = 0; i < 40; i++) {
    const x = v.x + pad + Math.random() * maxX, y = v.y + pad + Math.random() * maxY;
    const overlap = x < left.right + 12 && x + width > left.left - 12 && y < left.bottom + 12 && y + height > left.top - 12;
    const distance = Math.hypot(x - previous.left, y - previous.top);
    const score = distance - (overlap ? 10000 : 0);
    if (score > best) { best = score; position = {x,y}; }
    if (!overlap && distance > Math.min(v.width,v.height) * .4) break;
  }
  button.style.left = position.x + 'px'; button.style.top = position.y + 'px';
  feedback('選我！', true);
}
function keepButtonVisible() {
  const button = document.querySelector('.runaway');
  if (!button || button.hidden) return;
  const v = viewportBounds(), width = parseFloat(button.style.width), height = parseFloat(button.style.height);
  button.style.left = Math.max(v.x + 12, Math.min(parseFloat(button.style.left), v.x + v.width - width - 12)) + 'px';
  button.style.top = Math.max(v.y + 12, Math.min(parseFloat(button.style.top), v.y + v.height - height - 12)) + 'px';
}
window.addEventListener('resize', keepButtonVisible);
window.visualViewport?.addEventListener('resize', keepButtonVisible);
window.visualViewport?.addEventListener('scroll', keepButtonVisible);
function confetti() {
  if (reducedMotion) return;
  const colors = ['#ffa7c7','#c5fa6b','#b8acff','#ffdb85','#ffffff'];
  for (let i = 0; i < 65; i++) {
    const piece = document.createElement('i'); piece.className = 'confetti';
    piece.style.cssText = `left:${Math.random()*100}%;--duration:${2+Math.random()*2}s;--delay:${Math.random()*.6}s;--color:${colors[i%5]};--drift:${Math.random()*160-80}px;`;
    $('#particles').append(piece); setTimeout(() => piece.remove(), 4700);
  }
}
function emojis(emoji) {
  if (reducedMotion) return;
  for(let i = 0; i < 8; i++) {
    const piece = document.createElement('span'); piece.className='floating-emoji'; piece.textContent=emoji;
    piece.style.left = (8 + Math.random()*80) + '%'; $('#particles').append(piece); setTimeout(()=>piece.remove(),2100);
  }
}
function balloonMarkup(color) {
  return `<svg viewBox="0 0 90 180" aria-hidden="true"><path d="M45 100C22 127 67 141 42 177" stroke="white" stroke-width="2" fill="none"/><ellipse cx="45" cy="49" rx="35" ry="45" fill="${color}"/><path d="m45 89-8 14h16Z" fill="${color}"/><ellipse cx="30" cy="31" rx="7" ry="16" fill="white" opacity=".45" transform="rotate(25 30 31)"/></svg>`;
}
function finale() {
  stage = 4; cakeState = 0; document.body.classList.add('party');
  document.querySelector('.runaway')?.remove();
  render(`<img class="birthday-friend" src="assets/birthday-friend.png" alt="小孤獨眼睛閃閃發亮，陪你一起慶生" width="473" height="419"><h1 class="birthday-title" id="screen-title">祝ㄖㄗ生日快樂!!!</h1><div class="birthday-scene"><button class="balloon balloon-left" aria-label="戳左邊氣球放彩帶">${balloonMarkup('#f5a5c7')}</button><button class="balloon balloon-right" aria-label="戳右邊氣球放彩帶">${balloonMarkup('#a7baff')}</button><div class="cake-assembly" id="cake-assembly"><button id="candle" class="candle-button" aria-label="吹熄蠟燭"><span class="wick"></span><span class="flame"></span><span class="smoke">〰</span></button><span class="flame-tip">點燭火吹蠟燭 ↓</span><span class="wind" aria-hidden="true">〰 〰</span><button class="cake-image" id="cake" aria-label="點蛋糕吹熄蠟燭"><img src="assets/cake.svg" alt="草莓奶油生日蛋糕" draggable="false"></button><span class="cut-gap" aria-hidden="true"></span><span class="knife" aria-hidden="true">🔪</span><button id="slice" class="cake-slice" aria-label="吃一口切好的蛋糕" hidden><img src="assets/slice.svg" alt="切好的草莓蛋糕" draggable="false"></button><span class="crumbs" aria-hidden="true">· ✦ ·</span></div></div><p id="cake-hint" class="cake-hint" role="status">先許個願，再點燭火吹蠟燭。</p>`);
  $('#candle').onclick = cakeAction;
  $('#cake').onclick = cakeAction;
  $('#slice').onclick = eatSlice;
  document.querySelectorAll('.balloon').forEach(button => {
    button.onclick = () => {
      if (button.classList.contains('popped')) return;
      button.classList.add('popped'); confetti();
      setTimeout(() => { if (button.isConnected) button.classList.remove('popped'); }, 900);
    };
  });
  confetti();
}
let bites = 0;
function cakeAction() {
  const assembly = $('#cake-assembly');
  if (cakeState === 0) {
    cakeState = 1; assembly.classList.add('blown');
    $('#candle').disabled = true;
    $('#cake').setAttribute('aria-label', '切一塊蛋糕');
    $('#cake-hint').textContent = '願望已送出！點蛋糕切一塊。';
  } else if (cakeState === 1) {
    cakeState = 2; bites = 0; assembly.classList.add('cut');
    $('#slice').hidden = false;
    $('#slice').className = 'cake-slice';
    $('#cake').setAttribute('aria-label', '吃一口切好的蛋糕');
    $('#cake-hint').textContent = '點旁邊切好的蛋糕，開吃！';
  } else if (cakeState === 2) {
    eatSlice();
  } else {
    cakeState = 1; assembly.classList.remove('cut', 'eating', 'all-eaten');
    $('#cake').setAttribute('aria-label', '切一塊蛋糕');
    $('#cake-hint').textContent = '還吃得下？再點蛋糕切一塊！';
  }
}
function eatSlice() {
  if (cakeState !== 2) return;
  bites++;
  const slice = $('#slice'), assembly = $('#cake-assembly');
  slice.classList.add('bite-' + bites);
  assembly.classList.remove('eating'); void assembly.offsetWidth; assembly.classList.add('eating');
  if (bites >= 3) {
    cakeState = 3; slice.hidden = true; assembly.classList.add('all-eaten');
    $('#cake').setAttribute('aria-label', '再來一塊蛋糕');
    $('#cake-hint').textContent = '吃光光！點氣球放彩帶慶祝 🎉';
    confetti();
  } else {
    $('#cake-hint').textContent = bites === 1 ? '啊——好吃！再一口。' : '最後一口也留給你！';
  }
}
intro();


