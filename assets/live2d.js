(() => {
  const MODEL_URL = './assets/live2d/cat_model/cat.model3.json';

  const start = async () => {
    const widget = document.createElement('section');
    widget.className = 'live2d-widget';
    widget.id = 'live2d-widget';
    widget.setAttribute('aria-label', '可拖动的 Live2D 桌宠');
    widget.innerHTML = `
      <div class="live2d-handle">
        <span class="live2d-title">昔涟 · 拖动我</span>
        <button class="live2d-reset" type="button" data-live2d-reset>回到角落</button>
      </div>
      <div class="live2d-stage">
        <div class="live2d-loading">昔涟加载中...</div>
      </div>
    `;
    document.body.appendChild(widget);

    const stage = widget.querySelector('.live2d-stage');
    const loading = widget.querySelector('.live2d-loading');
    const handle = widget.querySelector('.live2d-handle');
    const resetButton = widget.querySelector('[data-live2d-reset]');

    if (!window.PIXI?.live2d?.Live2DModel || !window.Live2DCubismCore) {
      loading.textContent = 'Live2D 资源未就绪';
      return;
    }

    if (PIXI.live2d.Live2DModel.registerTicker) {
      PIXI.live2d.Live2DModel.registerTicker(PIXI.Ticker);
    }

    const app = new PIXI.Application({
      width: stage.clientWidth,
      height: stage.clientHeight,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2)
    });

    app.view.className = 'live2d-canvas';
    stage.appendChild(app.view);

    let model;
    try {
      model = await PIXI.live2d.Live2DModel.from(MODEL_URL);
    } catch (error) {
      console.error(error);
      loading.textContent = '昔涟加载失败';
      return;
    }

    loading.remove();
    app.stage.addChild(model);

    const fitModel = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      app.renderer.resize(width, height);
      if (model.anchor) {
        model.anchor.set(0.5, 1);
      }
      model.scale.set(0.2);
      model.position.set(width / 2, height - 6);
    };

    fitModel();
    window.addEventListener('resize', fitModel);

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const dock = () => {
      widget.style.left = '';
      widget.style.top = '';
      widget.style.right = '18px';
      widget.style.bottom = '18px';
    };

    dock();

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const place = (clientX, clientY) => {
      const left = clamp(clientX - offsetX, 8, window.innerWidth - widget.offsetWidth - 8);
      const top = clamp(clientY - offsetY, 8, window.innerHeight - widget.offsetHeight - 8);
      widget.style.left = `${left}px`;
      widget.style.top = `${top}px`;
    };

    handle.addEventListener('pointerdown', (event) => {
      dragging = true;
      widget.classList.add('dragging');
      const rect = widget.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      widget.style.left = `${rect.left}px`;
      widget.style.top = `${rect.top}px`;
      widget.style.right = 'auto';
      widget.style.bottom = 'auto';
      if (handle.setPointerCapture) {
        handle.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
    });

    window.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      place(event.clientX, event.clientY);
    });

    const stopDrag = () => {
      dragging = false;
      widget.classList.remove('dragging');
    };

    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);
    resetButton.addEventListener('click', (event) => {
      event.stopPropagation();
      dock();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
