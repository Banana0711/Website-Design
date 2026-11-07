/* =========================================================
   河海大学 · 百十河海，向海而生
   交互主脚本
   ========================================================= */

(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var params = new URLSearchParams(window.location.search);

  /* ---------------------------------------------------------
     刷新 / 带锚点进入时，总是回到首页开屏
     （关闭浏览器的滚动位置记忆，并清除地址栏锚点）
     --------------------------------------------------------- */
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  try {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch (err) { /* file:// 下忽略 */ }
  window.scrollTo(0, 0);

  /* ---------------------------------------------------------
     逐字揭示：把标题与导语拆成单字，滚动到位后依次浮现
     （Belgrade Arbor 文字揭示；减弱动效时不拆分，保证静态可读）
     --------------------------------------------------------- */
  if (!prefersReduced) {
    $$('[data-split]').forEach(function (el) {
      var base = parseInt(el.getAttribute('data-split-delay'), 10) || 0;
      var i = 0;
      function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.textContent.split('').forEach(function (ch) {
              if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
              var s = document.createElement('span');
              s.className = 'w';
              s.style.setProperty('--wd', Math.min(base + i * 26, 560) + 'ms');
              s.textContent = ch;
              frag.appendChild(s);
              i++;
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== 'BR') {
            walk(child);
          }
        });
      }
      walk(el);
    });
  }

  /* ---------------------------------------------------------
     开屏：数字加载进度 → 预渲染视频 → 标题弹入
     --------------------------------------------------------- */

  var introVideo = document.getElementById('introVideo');
  var introTimers = [];

  /* 标题逐字拆分：Belgrade Arbor 式入场，每个字符独立上浮 + 去模糊 */
  (function splitWordmark() {
    var wm = document.querySelector('.intro-wordmark');
    if (!wm || prefersReduced || wm.querySelector('.ch')) return;
    var text = wm.textContent.trim();
    if (!text) return;
    wm.setAttribute('aria-label', text);
    wm.textContent = '';
    var i = 0;
    /* 以词为单位包裹，保证小屏换行时单词不被拆断 */
    text.split(/\s+/).forEach(function (word, wi) {
      if (wi > 0) {
        var sp = document.createElement('span');
        sp.className = 'sp';
        sp.textContent = '\u00A0';
        wm.appendChild(sp);
      }
      var wd = document.createElement('span');
      wd.className = 'wd';
      word.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.style.setProperty('--i', i++);
        s.textContent = ch;
        wd.appendChild(s);
      });
      wm.appendChild(wd);
    });
  })();

  function finishIntro() {
    introTimers.forEach(function (t) { window.clearTimeout(t); });
    introTimers = [];
    hideIntroLoader();
    var v = introVideo;
    if (v) {
      /* 结束后直接停在末帧，不再 seek，避免视频与实景之间出现空档 */
      try { v.pause(); } catch (e) {}
    }
    document.body.classList.remove('is-playing');
    document.body.classList.add('is-revealed');
  }

  /* 开场数字加载进度：预载开屏素材，进度缓动到 100 后淡出并启动开场 */
  /* phase 钩子 / 减弱动效 / 用户跳过：立即隐藏加载页（正常完成路径才有淡出） */
  function hideIntroLoader() {
    var loader = document.getElementById('introLoader');
    document.body.classList.remove('is-loading');
    if (!loader) return;
    loader.style.transition = 'none';
    loader.classList.add('is-done');
  }

  function runIntroLoader(onReady) {
    var loader = document.getElementById('introLoader');
    if (!loader) { onReady(); return; }
    var num = document.getElementById('loaderNum');
    var bar = document.getElementById('loaderBar');
    var real = 0, shown = 0, done = false, finished = false;
    var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    document.body.classList.add('is-loading');

    /* 预载开场视频：能播即视为就绪，失败也放行，避免卡在加载页 */
    function ready() { done = true; }
    if (introVideo) {
      if (introVideo.readyState >= 3) {
        done = true;
      } else {
        introVideo.addEventListener('canplay', ready, { once: true });
        introVideo.addEventListener('loadeddata', ready, { once: true });
        introVideo.addEventListener('error', ready, { once: true });
        try { introVideo.load(); } catch (e) {}
      }
    } else {
      done = true;
    }

    function finish() {
      if (finished) return;
      finished = true;
      num.textContent = '100';
      bar.style.width = '100%';
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      window.setTimeout(onReady, 320);
    }

    /* 兜底：任何环境（rAF 节流、后台标签、异常）下 6s 后必然进入开场 */
    var failSafe = window.setTimeout(finish, 6000);

    /* 固定 2s 的缓入缓出进度，与网络快慢解耦；视频未就绪时停在 99% 等待 */
    function easeInOut(t) {
      return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function frame(now) {
      if (finished) return;
      var el = ((now || Date.now()) - t0) / 1000;
      var p = easeInOut(clamp(el / 2, 0, 1));
      real = done ? Math.max(real, p) : Math.min(p, .97);
      shown += (real - shown) * .12;
      num.textContent = Math.min(Math.round(shown * 100), 100);
      bar.style.width = Math.min(shown * 100, 100) + '%';
      if (el >= 2 && done) {
        window.clearTimeout(failSafe);
        finish();
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (params.has('phase')) {
    var ph = params.get('phase');
    if (ph === 'final' || ph === 'revealed' || ph === 'water') {
      var applyEnd = function () {
        document.body.classList.add('is-playing');
        finishIntro();
      };
      if (introVideo && introVideo.readyState < 1) {
        introVideo.addEventListener('loadedmetadata', applyEnd, { once: true });
      } else {
        applyEnd();
      }
    } else {
      hideIntroLoader();
      document.body.classList.add('is-playing');
    }
  } else if (prefersReduced) {
    finishIntro();
  } else {
    var introStarted = false;

    function startIntro() {
      if (introStarted || document.body.classList.contains('is-revealed')) return;
      introStarted = true;
      var v = introVideo;
      if (!v) { finishIntro(); return; }
      v.muted = true;
      document.body.classList.add('is-playing');

      var end = function () { finishIntro(); };
      v.addEventListener('ended', end, { once: true });
      v.addEventListener('error', end, { once: true });

      var p = v.play();
      if (p && p.catch) {
        p.catch(function () {
          /* 自动播放被浏览器拦截：直接落到结束帧 + 标题，至少保证首页完整 */
          finishIntro();
        });
      }

      /* 兜底：视频异常卡住时，16s 后收尾 */
      introTimers.push(window.setTimeout(function () {
        if (!v.ended) finishIntro();
      }, 16000));
    }

    runIntroLoader(startIntro);
  }

  /* ---------------------------------------------------------
     顶部导航
     --------------------------------------------------------- */

  var head = $('#siteHead');
  var nav = $('#siteNav');
  var navToggle = $('#navToggle');

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('is-locked', open);
    });
  }

  $$('.site-nav a').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });

  // “首页”统一回到页面最顶端，并清除地址栏里的板块锚点
  $$('[data-home]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      closeNav();
      if (window.history && window.history.replaceState) {
        try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (err) { /* file:// 下忽略 */ }
      }
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
      setNavActive('intro');
    });
  });

  var lastY = 0;
  function headerState() {
    var y = window.scrollY || window.pageYOffset;
    if (head) head.classList.toggle('is-scrolled', y > 40);
    lastY = y;
  }
  headerState();
  window.addEventListener('scroll', headerState, { passive: true });

  /* ---------------------------------------------------------
     淮河溯源：滚动驱动
     --------------------------------------------------------- */

  var journey = $('#journey');
  var scenes = $$('.scene');
  var copies = $$('.scene-copy');
  var dots = $$('.rail-dot');
  var railYears = $$('.rail-years span');
  var railFill = $('#railFill');
  var yearGhost = $('#yearGhost');
  var journeyHint = $('.journey-hint span');

  var SCENE_LABELS = ['1915', '1924', '1928', '1952', '1985'];

  var currentScene = -1;
  var journeyTicking = false;

  function updateJourney() {
    journeyTicking = false;
    if (!journey) return;

    var rect = journey.getBoundingClientRect();
    var total = journey.offsetHeight - window.innerHeight;
    var p = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;

    // 逐场景停留 + 淡入淡出：每到一段先停住，再缓缓过渡到下一段
    var seg = 1 / scenes.length;
    var idx = clamp(Math.floor(p / seg + 0.0001), 0, scenes.length - 1);

    if (idx !== currentScene) {
      currentScene = idx;
      scenes.forEach(function (s, k) { s.classList.toggle('is-on', k === idx); });
      copies.forEach(function (c, k) { c.classList.toggle('is-on', k === idx); });
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === idx); });
      railYears.forEach(function (y, k) { y.classList.toggle('is-on', k === idx); });
      if (yearGhost) yearGhost.textContent = SCENE_LABELS[idx];
      if (journeyHint) {
        journeyHint.textContent = idx === 4 ? '河海，向海而生' : '继续向下 · 顺流而下';
      }
    }

    if (railFill) railFill.style.height = (p * 100).toFixed(2) + '%';
    if (window.Water) window.Water.setProgress(p);
  }

  function onJourneyScroll() {
    if (!journeyTicking) {
      journeyTicking = true;
      window.requestAnimationFrame(updateJourney);
    }
  }

  if (journey) {
    updateJourney();
    window.addEventListener('scroll', onJourneyScroll, { passive: true });
    window.addEventListener('resize', onJourneyScroll);
  }

  /* ---------------------------------------------------------
     当前章节导航高亮
     --------------------------------------------------------- */

  var navLinks = $$('.site-nav a');
  var panelNavKeys = ['', 'culture', 'people', 'alumni', 'map', 'guestbook'];

  function setNavActive(key) {
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-nav') === key);
    });
  }

  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        if (id === 'intro') setNavActive('intro');
        else if (id === 'journey') setNavActive('journey');
        else if (id === 'coda') setNavActive('history');
        else if (id === 'ocean') setNavActive('');
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    ['intro', 'journey', 'coda', 'ocean'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------
     六章：横向拖拽
     --------------------------------------------------------- */

  var rail = $('#rail');
  var panels = $$('.panel', rail || document);
  var railPrev = $('#railPrev');
  var railNext = $('#railNext');
  var railProgress = $('#railProgress');
  var railIndex = $('#railIndex');

  function panelLeft(panel) {
    return panel.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
  }

  function scrollToPanel(i, smooth) {
    if (!rail || !panels[i]) return;
    rail.scrollTo({ left: panelLeft(panels[i]), behavior: smooth === false ? 'auto' : 'smooth' });
  }

  function currentPanel() {
    if (!rail) return 0;
    /* 已滚到轨道最右端时，直接认定为最后一块（留言），避免末块因对齐误差被误判 */
    if (rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2) return panels.length - 1;
    var best = 0;
    var bestDist = Infinity;
    panels.forEach(function (p, i) {
      var d = Math.abs(panelLeft(p) - rail.scrollLeft);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  var wallFrame = document.querySelector('.wall-frame');

  function signalWall(active) {
    if (!wallFrame || !wallFrame.contentWindow) return;
    wallFrame.contentWindow.postMessage(active ? 'wall:resume' : 'wall:pause', '*');
  }

  if (wallFrame) {
    wallFrame.addEventListener('load', function () { signalWall(currentPanel() === 5); });
  }

  function updateRailUI() {
    if (!rail) return;
    var i = currentPanel();
    if (railIndex) railIndex.textContent = String(i).padStart(2, '0') + ' / ' + String(panels.length - 1).padStart(2, '0');
    /* 停在地图块时隐藏相邻留言块，避免右侧露出留言卡片 */
    document.body.classList.toggle('at-map', i === 4);
    /* 只有停留在留言块时才让内嵌卡片墙继续动画，其余时间暂停以省性能 */
    signalWall(i === 5);
    if (railProgress) railProgress.style.transform = 'scale(' + (1 + i * 0.12) + ')';
    if (railPrev) railPrev.disabled = i <= 0;
    if (railNext) railNext.disabled = i >= panels.length - 1;
    setNavActive(panelNavKeys[i]);
    if (i >= 1) {
      // 让对应的面板内容进入
      panels[i].classList.add('in');
    }
  }

  if (rail) {
    var railTicking = false;
    rail.addEventListener('scroll', function () {
      if (!railTicking) {
        railTicking = true;
        window.requestAnimationFrame(function () { railTicking = false; updateRailUI(); });
      }
    }, { passive: true });

    if (railPrev) railPrev.addEventListener('click', function () { scrollToPanel(Math.max(0, currentPanel() - 1)); });
    if (railNext) railNext.addEventListener('click', function () { scrollToPanel(Math.min(panels.length - 1, currentPanel() + 1)); });

    rail.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        scrollToPanel(e.key === 'ArrowRight'
          ? Math.min(panels.length - 1, currentPanel() + 1)
          : Math.max(0, currentPanel() - 1));
      }
    });

    /* 方向键浏览：五章板块在视口内时，无需聚焦轨道也可用左右方向键 */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var t = e.target;
      if (t && (t.matches && t.matches('input, textarea, select')) || (t && t.isContentEditable)) return;
      var section = $('#panels');
      if (!section) return;
      var rect = section.getBoundingClientRect();
      var inView = rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4;
      if (!inView) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); scrollToPanel(Math.min(panels.length - 1, currentPanel() + 1)); }
      else { e.preventDefault(); scrollToPanel(Math.max(0, currentPanel() - 1)); }
    });

    updateRailUI();
  }

  /* 面板进入视口时上浮 */
  if ('IntersectionObserver' in window) {
    var panelObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          panelObserver.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    panels.forEach(function (p) { panelObserver.observe(p); });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        // 可逆揭示：滚回去时文字随叙事倒带（Belgrade Arbor scrub 语言）
        en.target.classList.toggle('in', en.isIntersecting);
      });
    }, { threshold: 0.18 });
    $$('.reveal').forEach(function (el) { revealObserver.observe(el); });
  } else {
    panels.forEach(function (p) { p.classList.add('in'); });
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* 导航、索引、页脚跳转到指定面板 */
  function jumpToPanel(i) {
    var section = $('#panels');
    if (!section) return;
    section.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(function () { scrollToPanel(i); }, prefersReduced ? 0 : 620);
  }

  $$('[data-panel]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      closeNav();
      jumpToPanel(parseInt(a.getAttribute('data-panel'), 10));
    });
  });

  $$('[data-goto]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      jumpToPanel(parseInt(a.getAttribute('data-goto'), 10));
    });
  });

  $$('[data-foot-goto]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      jumpToPanel(parseInt(a.getAttribute('data-foot-goto'), 10));
    });
  });

  /* 导航「校史」：页内平滑滚动到溯流尾声（含“展开百年校史”入口） */
  $$('[data-nav="history"], .foot-nav a[href="#coda"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      closeNav();
      var section = $('#coda');
      if (section) section.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------------------------------------------------------
     校园地图
     --------------------------------------------------------- */

  var campusData = [
    {
      name: '西康路校区',
      loc: '南京 · 鼓楼 · 西康路 1 号',
      desc: '百年的起点。校门、水利馆与梧桐，把河海的时间折叠在这一条路上。',
      tag: '百年主校区 · 校史原点',
      img: 'assets/img/campus-gate.jpg?v=2',
      alt: '西康路校区校门'
    },
    {
      name: '江宁校区',
      loc: '南京 · 江宁 · 佛城西路 8 号',
      desc: '更开阔的校园，更年轻的水。图书馆临水而立，把一代代河海人的清晨收进窗里。',
      tag: '现代化主校区 · 本科教学',
      img: 'assets/img/campus-library.jpg?v=2',
      alt: '江宁校区校门'
    },
    {
      name: '常州校区',
      loc: '常州 · 长荡湖畔',
      desc: '向产业与未来延伸的校区。实验室、运动场与湖风，构成河海在长三角的另一处坐标。',
      tag: '产学研融合 · 常州',
      img: 'assets/img/campus-stadium.jpg?v=2',
      alt: '常州校区全景'
    }
  ];

  var campusCard = $('#campusCard');
  var campusImg = $('#campusImg');
  var campusName = $('#campusName');
  var campusLoc = $('#campusLoc');
  var campusDesc = $('#campusDesc');
  var campusTag = $('#campusTag');
  var mapPins = $$('.map-pin');

  function setCampus(i) {
    var d = campusData[i];
    if (!d || !campusCard) return;
    mapPins.forEach(function (pin, k) { pin.classList.toggle('is-active', k === i); });
    campusCard.classList.add('is-switching');

    window.setTimeout(function () {
      if (campusImg) {
        campusImg.src = d.img;
        campusImg.alt = d.alt;
      }
      if (campusName) campusName.textContent = d.name;
      if (campusLoc) campusLoc.textContent = d.loc;
      if (campusDesc) campusDesc.textContent = d.desc;
      if (campusTag) campusTag.textContent = d.tag;
      campusCard.classList.remove('is-switching');
    }, 220);
  }

  mapPins.forEach(function (pin) {
    pin.addEventListener('click', function () {
      setCampus(parseInt(pin.getAttribute('data-campus'), 10));
    });
  });

  /* ---------------------------------------------------------
     留言墙（伪后端）
     --------------------------------------------------------- */

  var STORAGE_KEY = 'hohai-guestbook-v1';
  var PRESETS = [
    { name: '一位 2016 级校友', text: '从西康路到江宁，把青春留在了河海。', time: '2026-10-18 21:04' },
    { name: '水利水电学院 · 小周', text: '愿做一滴水，汇入江河湖海。', time: '2026-10-19 09:12' },
    { name: '2013 级 老张', text: '毕业十年，还是会想起图书馆闭馆时的音乐。', time: '2026-10-19 22:37' },
    { name: '一位水之子', text: '祝母校百十华诞，向海而生。', time: '2026-10-20 08:45' },
    { name: '2025 级 新生', text: '第一次看见校门的时候，没想到会走这么久。', time: '2026-10-20 19:20' }
  ];

  var guestForm = $('#guestForm');
  var guestName = $('#guestName');
  var guestText = $('#guestText');
  var guestList = $('#guestList');
  var guestCount = $('#guestCount');
  var charCount = $('#charCount');
  var toast = $('#toast');

  function readStore() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function writeStore(arr) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) { /* ignore */ }
  }

  function escapeText(s) {
    return String(s);
  }

  function makeItem(msg, isNew) {
    var li = document.createElement('li');
    li.className = 'guest-item';

    var header = document.createElement('header');
    var strong = document.createElement('strong');
    strong.textContent = escapeText(msg.name);
    var time = document.createElement('time');
    time.textContent = escapeText(msg.time);
    header.appendChild(strong);
    header.appendChild(time);

    var p = document.createElement('p');
    p.textContent = escapeText(msg.text);

    li.appendChild(header);
    li.appendChild(p);
    if (isNew) li.style.animationDelay = '0s';
    return li;
  }

  function renderGuests() {
    if (!guestList) return;
    var stored = readStore();
    var all = stored.concat(PRESETS).slice(0, 24);
    guestList.innerHTML = '';
    all.forEach(function (m) { guestList.appendChild(makeItem(m, false)); });
    if (guestCount) guestCount.textContent = (stored.length + PRESETS.length) + ' 条';
  }

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-on');
    window.clearTimeout(showToast.t);
    showToast.t = window.setTimeout(function () { toast.classList.remove('is-on'); }, 2200);
  }

  if (guestForm) {
    renderGuests();

    guestText.addEventListener('input', function () {
      charCount.textContent = guestText.value.length + ' / 60';
    });

    guestForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = guestName.value.trim().slice(0, 12);
      var text = guestText.value.trim().slice(0, 60);
      if (!name || !text) {
        showToast('名字和留言都要留下');
        return;
      }

      var btn = guestForm.querySelector('.btn-send');
      var label = btn.querySelector('.duo-a');
      btn.disabled = true;
      label.textContent = '正在汇入…';

      window.setTimeout(function () {
        var now = new Date();
        var stamp = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0') + ' ' +
          String(now.getHours()).padStart(2, '0') + ':' +
          String(now.getMinutes()).padStart(2, '0');

        var stored = readStore();
        stored.unshift({ name: name, text: text, time: stamp });
        writeStore(stored.slice(0, 60));

        renderGuests();
        if (guestList && guestList.firstChild) {
          guestList.firstChild.classList.add('is-fresh');
        }
        guestText.value = '';
        charCount.textContent = '0 / 60';
        btn.disabled = false;
        label.textContent = '投入河中';
        showToast('你的话，已汇入河海');
      }, 720);
    });
  }

  /* ---------------------------------------------------------
     页脚年份
     --------------------------------------------------------- */

  var yearNow = new Date().getFullYear();
  var copyYear = $('.foot-bottom span');
  if (copyYear) copyYear.textContent = '© ' + yearNow + ' 河海大学网页设计大赛参赛作品';

  /* ---------------------------------------------------------
     光标涟漪：鼠标划过处荡开层层水纹
     --------------------------------------------------------- */
  var canHover = window.matchMedia('(pointer: fine)').matches;
  if (!prefersReduced && canHover) {
    var rippleCanvas = document.createElement('canvas');
    rippleCanvas.className = 'ripple-layer';
    rippleCanvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(rippleCanvas);

    var rctx = rippleCanvas.getContext('2d');
    var ripples = [];
    var rippleDpr = Math.min(window.devicePixelRatio || 1, 2);

    function sizeRippleCanvas() {
      rippleCanvas.width = Math.round(window.innerWidth * rippleDpr);
      rippleCanvas.height = Math.round(window.innerHeight * rippleDpr);
      rctx.setTransform(rippleDpr, 0, 0, rippleDpr, 0, 0);
    }
    sizeRippleCanvas();
    window.addEventListener('resize', sizeRippleCanvas);

    var lastSpawn = { x: 0, y: 0, t: 0 };
    var rippleLooping = false;

    function drawRipples(t) {
      var dt = Math.min(50, t - (drawRipples.last || t));
      drawRipples.last = t;
      rctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i];
        rp.life += dt;
        var k = rp.life / rp.dur;
        if (k >= 1) { ripples.splice(i, 1); continue; }
        var eased = 1 - Math.pow(1 - k, 2.2);
        var r = 2 + rp.max * eased;
        var alpha = (1 - k) * (1 - k) * 0.2;
        rctx.beginPath();
        rctx.arc(rp.x, rp.y, r, 0, Math.PI * 2);
        rctx.strokeStyle = 'rgba(86, 166, 186, ' + alpha.toFixed(3) + ')';
        rctx.lineWidth = 1.1;
        rctx.stroke();
        if (r > 10) {
          rctx.beginPath();
          rctx.arc(rp.x, rp.y, r * 0.62, 0, Math.PI * 2);
          rctx.strokeStyle = 'rgba(120, 200, 220, ' + (alpha * 0.6).toFixed(3) + ')';
          rctx.stroke();
        }
      }
      if (ripples.length) {
        window.requestAnimationFrame(drawRipples);
      } else {
        rippleLooping = false;
        drawRipples.last = 0;
      }
    }

    function spawnRipple(x, y, strength) {
      if (ripples.length > 10) ripples.shift();
      ripples.push({
        x: x, y: y, life: 0,
        max: 38 + (strength || 1) * 24,
        dur: 2400 + Math.random() * 1100
      });
      if (!rippleLooping) {
        rippleLooping = true;
        window.requestAnimationFrame(drawRipples);
      }
    }

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var now = performance.now();
      var dx = e.clientX - lastSpawn.x;
      var dy = e.clientY - lastSpawn.y;
      if (now - lastSpawn.t < 120 || dx * dx + dy * dy < 2600) return;
      lastSpawn = { x: e.clientX, y: e.clientY, t: now };
      spawnRipple(e.clientX, e.clientY, 1);
    }, { passive: true });

    window.addEventListener('pointerdown', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      spawnRipple(e.clientX, e.clientY, 2.2);
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     按钮 / CTA：水波纹质感
     --------------------------------------------------------- */
  var waterSelectors = [
    '.rail-arrow', '.ocean-cta', '.detail-back',
    '.detail-next', '.detail-home', '.btn-send'
  ];
  var waterHosts = $$(waterSelectors.join(','));
  waterHosts.forEach(function (el) { el.classList.add('water-btn'); });

  document.addEventListener('pointerdown', function (e) {
    var host = e.target.closest && e.target.closest('.water-btn');
    if (!host) return;
    var box = host.getBoundingClientRect();
    var size = Math.max(box.width, box.height) * 1.6;
    var ring = document.createElement('span');
    ring.className = 'btn-ripple';
    ring.style.width = size + 'px';
    ring.style.height = size + 'px';
    ring.style.left = (e.clientX - box.left) + 'px';
    ring.style.top = (e.clientY - box.top) + 'px';
    host.appendChild(ring);
    window.setTimeout(function () { ring.remove(); }, 900);
  }, { passive: true });

  /* ---------------------------------------------------------
     六章横向栏目：轨道边缘提示状态（浏览改为方向键 / 箭头）
     --------------------------------------------------------- */
  var railWrap = $('#railWrap');
  if (rail && railWrap) {
    rail.addEventListener('scroll', function () {
      railWrap.classList.toggle('is-at-left', rail.scrollLeft <= 2);
      railWrap.classList.toggle('is-at-right', rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2);
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     演示 / 验收定位：?p=0.5 直达叙事进度，?panel=3 直达板块
     --------------------------------------------------------- */

  if (params.has('p')) {
    var targetP = clamp(parseFloat(params.get('p')) || 0, 0, 1);
    var jumpToP = function () {
      var j = $('#journey');
      if (!j) return;
      document.documentElement.style.scrollBehavior = 'auto';
      var top = j.offsetTop + targetP * (j.offsetHeight - window.innerHeight);
      document.scrollingElement.scrollTop = top;
      if (window.scrollY < top - 4) window.scrollTo(0, top);
    };
    window.setTimeout(jumpToP, 300);
    window.setTimeout(jumpToP, 1800);
    window.addEventListener('load', jumpToP);
  }

  if (params.has('panel')) {
    var targetPanel = parseInt(params.get('panel'), 10) || 0;
    window.setTimeout(function () {
      document.documentElement.style.scrollBehavior = 'auto';
      var section = $('#panels');
      if (section) section.scrollIntoView({ behavior: 'auto', block: 'start' });
      window.setTimeout(function () { scrollToPanel(targetPanel, false); }, 120);
    }, 260);
  }

})();

