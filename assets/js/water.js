/* =========================================================
   河水流动 · WebGL 着色器
   固定水带 + 噪声流动，随叙事进度由山涧青转为深海蓝
   ========================================================= */

(function () {
  var canvas = document.getElementById('water');
  if (!canvas) return;

  var gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
  if (!gl) {
    document.body.classList.add('no-webgl');
    return;
  }

  var VERT = [
    'attribute vec2 a_pos;',
    'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2 u_res;',
    'uniform float u_time;',
    'uniform float u_p;',
    '',
    'float hash(vec2 p) {',
    '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);',
    '}',
    '',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  float a = hash(i);',
    '  float b = hash(i + vec2(1.0, 0.0));',
    '  float c = hash(i + vec2(0.0, 1.0));',
    '  float d = hash(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
    '}',
    '',
    'float fbm(vec2 p) {',
    '  float v = 0.0;',
    '  float a = 0.5;',
    '  for (int i = 0; i < 5; i++) {',
    '    v += a * noise(p);',
    '    p *= 2.03;',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    '',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / u_res;',
    '  float flow = u_time * (0.055 + u_p * 0.13);',
    '  vec2 p = vec2(uv.x * 3.1, uv.y * 4.8 - flow);',
    '  float n = fbm(p + fbm(p * 1.35 + u_time * 0.028));',
    '  float ripple = smoothstep(0.30, 0.80, n);',
    '',
    '  vec3 deepA = vec3(0.012, 0.050, 0.068);',
    '  vec3 deepB = vec3(0.008, 0.030, 0.058);',
    '  vec3 shallowA = vec3(0.150, 0.380, 0.430);',
    '  vec3 shallowB = vec3(0.080, 0.270, 0.380);',
    '  vec3 deep = mix(deepA, deepB, u_p);',
    '  vec3 shallow = mix(shallowA, shallowB, u_p);',
    '  vec3 col = mix(deep, shallow, ripple * 0.58);',
    '',
    '  float horizon = smoothstep(0.58, 1.0, uv.y);',
    '  col += vec3(0.40, 0.24, 0.10) * horizon * 0.11 * (1.0 - u_p * 0.55);',
    '',
    '  float s = fbm(vec2(uv.x * 20.0, uv.y * 2.6 - u_time * 0.42));',
    '  col += vec3(0.48, 0.68, 0.72) * smoothstep(0.78, 0.97, s) * 0.11;',
    '',
    '  float edge = abs(uv.x - 0.5) * 2.0;',
    '  col *= 1.0 - 0.32 * edge * edge;',
    '',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('water shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) {
    document.body.classList.add('no-webgl');
    return;
  }

  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('water link:', gl.getProgramInfoLog(program));
    document.body.classList.add('no-webgl');
    return;
  }
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  var aPos = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(program, 'u_res');
  var uTime = gl.getUniformLocation(program, 'u_time');
  var uP = gl.getUniformLocation(program, 'u_p');

  var progress = 0;
  var visible = true;
  var raf = null;
  var start = performance.now();
  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  function resize() {
    var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function draw(now) {
    raf = null;
    if (!visible) return;
    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform1f(uP, progress);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(draw);
  }

  function kick() {
    if (raf === null && visible) raf = requestAnimationFrame(draw);
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, 12.0);
    gl.uniform1f(uP, 0.2);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  } else {
    kick();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) kick();
    }, { threshold: 0.01 }).observe(canvas);
  }

  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
    if (visible) kick();
  });

  window.addEventListener('resize', function () {
    resize();
    if (reduced) {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, 12.0);
      gl.uniform1f(uP, progress);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  });

  window.Water = {
    setProgress: function (p) {
      progress = Math.max(0, Math.min(1, p));
      if (reduced) {
        gl.uniform1f(uP, progress);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    }
  };
})();
