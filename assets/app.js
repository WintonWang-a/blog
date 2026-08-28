(() => {
  const buttons = document.querySelectorAll('[data-music-toggle]');
  const state = document.querySelector('[data-music-state]');

  if (!buttons.length || !state) return;

  let audioContext = null;
  let timer = null;
  let playing = false;
  let step = 0;

  const pattern = [
    { bass: 110.0, lead: 440.0 },
    { bass: 130.81, lead: 493.88 },
    { bass: 146.83, lead: 392.0 },
    { bass: 164.81, lead: 523.25 }
  ];

  const updateUI = () => {
    buttons.forEach((button) => {
      button.textContent = playing ? '暂停 BGM' : '播放 BGM';
      button.setAttribute('aria-pressed', String(playing));
    });
    state.textContent = playing ? '播放中' : '已暂停';
    document.body.classList.toggle('music-playing', playing);
  };

  const pluck = (frequency, type, gainValue, duration) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = 1600;

    osc.type = type;
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + duration + 0.05);
  };

  const tick = () => {
    const current = pattern[step % pattern.length];
    pluck(current.bass, 'triangle', 0.05, 0.46);

    if (step % 2 === 0) {
      pluck(current.lead, 'sine', 0.028, 0.28);
    }

    step += 1;
  };

  const start = async () => {
    audioContext = audioContext || new AudioContext();
    await audioContext.resume();
    tick();
    timer = setInterval(tick, 520);
    playing = true;
    updateUI();
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    playing = false;
    updateUI();
  };

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        if (playing) {
          stop();
        } else {
          await start();
        }
      } catch (error) {
        console.error(error);
        state.textContent = '浏览器不支持';
      }
    });
  });

  updateUI();
})();
