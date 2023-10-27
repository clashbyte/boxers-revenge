import { vec2 } from 'gl-matrix';
import { Audio } from './engine/Audio.ts';
import { Controls } from './engine/Controls.ts';
import { Renderer } from './engine/Renderer.ts';
import { ScreenManager } from './engine/ScreenManager.ts';

const canvas = document.getElementsByTagName('canvas')[0]!;
const GL = canvas.getContext('webgl2', {
  premultipliedAlpha: false,
})!;

const screenSize = vec2.fromValues(1, 1);

const onResize = () => {
  const dpi = window.devicePixelRatio;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpi;
  canvas.height = height * dpi;
  vec2.set(screenSize, width * dpi, height * dpi);

  Renderer.resize(width * dpi, height * dpi);
};
window.addEventListener('resize', onResize);

let prevTime: number = 0;
const onFrame = (time: number) => {
  requestAnimationFrame(onFrame);
  const delta = (time - prevTime) / 16.6667;
  prevTime = time;

  ScreenManager.update(delta);
  ScreenManager.render();
  Controls.reset();
  Audio.update(delta);
};

const bootstrap = () => {
  Audio.init();
  Renderer.init();
  onResize();
  ScreenManager.init();
  Controls.bind();

  prevTime = performance.now();
  onFrame(prevTime);
};

export { bootstrap, screenSize, GL };
