(function () {
  'use strict';

  var Engine    = Matter.Engine;
  var Bodies    = Matter.Bodies;
  var Body      = Matter.Body;
  var Composite = Matter.Composite;
  var Runner    = Matter.Runner;
  var Events    = Matter.Events;

  function init() {
    var wordEls = document.querySelectorAll('.word');
    var rects = Array.prototype.slice.call(wordEls).map(function (el) {
      return el.getBoundingClientRect();
    });
    setTimeout(function () {
      launchPhysics(wordEls, rects);
    }, 900);
  }

  function launchPhysics(wordEls, initialRects) {
    var W      = window.innerWidth;
    var H      = window.innerHeight;
    var PAD    = 80;
    var MARGIN = 10;

    var engine = Engine.create({ gravity: { x: 0, y: 2.4 } });

    var floor = Bodies.rectangle(W / 2, H - MARGIN + PAD / 2, W * 3, PAD, { isStatic: true, label: 'floor' });
    var wallL = Bodies.rectangle(MARGIN - PAD / 2, H / 2, PAD, H * 4, { isStatic: true, label: 'wallL' });
    var wallR = Bodies.rectangle(W - MARGIN + PAD / 2, H / 2, PAD, H * 4, { isStatic: true, label: 'wallR' });
    Composite.add(engine.world, [floor, wallL, wallR]);

    window.addEventListener('resize', function () {
      var nW = window.innerWidth;
      var nH = window.innerHeight;
      Body.setPosition(floor, { x: nW / 2, y: nH - MARGIN + PAD / 2 });
      Body.setPosition(wallL, { x: MARGIN - PAD / 2, y: nH / 2 });
      Body.setPosition(wallR, { x: nW - MARGIN + PAD / 2, y: nH / 2 });
    });

    Array.prototype.forEach.call(wordEls, function (el, i) {
      var r = initialRects[i];
      el.style.position        = 'fixed';
      el.style.left            = r.left + 'px';
      el.style.top             = r.top + 'px';
      el.style.width           = r.width + 'px';
      el.style.height          = r.height + 'px';
      el.style.margin          = '0';
      el.style.padding         = '0';
      el.style.lineHeight      = r.height + 'px';
      el.style.textAlign       = 'center';
      el.style.display         = 'block';
      el.style.transformOrigin = 'center center';
      el.style.willChange      = 'left, top, transform';
    });

    var bodies = initialRects.map(function (r) {
      var body = Bodies.rectangle(
        r.left + r.width / 2,
        r.top + r.height / 2,
        r.width,
        r.height * 0.75,
        { isStatic: true, restitution: 0.42, friction: 0.55, frictionAir: 0.009 }
      );
      Composite.add(engine.world, body);
      return body;
    });

    var STAGGER = 180;
    bodies.forEach(function (body, i) {
      setTimeout(function () {
        Body.setStatic(body, false);
        Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.4, y: 0 });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);
      }, i * STAGGER);
    });

    var letterPairs    = [];
    var letterFontSize   = getComputedStyle(document.querySelector('.text')).fontSize;
    var letterFontFamily = getComputedStyle(document.body).fontFamily;
    var letterColor      = getComputedStyle(document.body).color;

    function spawnLetter(char) {
      var el = document.createElement('span');
      el.textContent = char;
      el.style.position              = 'fixed';
      el.style.left                  = '-9999px';
      el.style.top                   = '-9999px';
      el.style.display               = 'block';
      el.style.fontFamily            = letterFontFamily;
      el.style.fontSize              = letterFontSize;
      el.style.fontWeight            = '500';
      el.style.fontVariationSettings = "'wght' 500";
      el.style.color                 = letterColor;
      el.style.lineHeight            = '1';
      el.style.whiteSpace            = 'nowrap';
      el.style.transformOrigin       = 'center center';
      el.style.willChange            = 'left, top, transform';
      el.style.margin                = '0';
      el.style.padding               = '0';
      document.body.appendChild(el);

      var lw = el.offsetWidth;
      var lh = el.offsetHeight;

      var startX = MARGIN + lw / 2 + Math.random() * Math.max(0, W - 2 * MARGIN - lw);
      var startY = MARGIN + lh / 2 + 10;

      el.style.left   = (startX - lw / 2) + 'px';
      el.style.top    = (startY - lh / 2) + 'px';
      el.style.width  = lw + 'px';
      el.style.height = lh + 'px';

      var body = Bodies.rectangle(startX, startY, lw, lh * 0.75, {
        restitution: 0.42, friction: 0.55, frictionAir: 0.009
      });
      Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.5, y: 0.5 });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);
      Composite.add(engine.world, body);
      letterPairs.push({ el: el, body: body, lw: lw, lh: lh });
    }

    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      spawnLetter(e.key);
    });

    var isDesktop = window.matchMedia('(pointer: fine)').matches;
    if (isDesktop) {
      var cursorBody = Bodies.rectangle(-2000, -2000, 56, 8, {
        isStatic: true, restitution: 0.1, friction: 1.0, label: 'cursor'
      });
      Composite.add(engine.world, cursorBody);

      var mouseX      = -2000;
      var mouseY      = -2000;
      var allReleased = false;
      var allSettled  = false;

      document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
      });

      document.addEventListener('mouseleave', function () {
        mouseX = -2000;
        mouseY = -2000;
      });

      setTimeout(function () {
        allReleased = true;
      }, (bodies.length - 1) * STAGGER + 600);

      Events.on(engine, 'beforeUpdate', function () {
        if (allSettled) return;
        Body.setPosition(cursorBody, { x: mouseX, y: mouseY });
        if (!allReleased) return;
        var settled = bodies.every(function (b) {
          return b.speed < 0.25 && b.angularSpeed < 0.01;
        });
        if (settled) {
          allSettled = true;
          Body.setPosition(cursorBody, { x: -2000, y: -2000 });
        }
      });
    }

    Runner.run(Runner.create(), engine);

    function tick() {
      Array.prototype.forEach.call(wordEls, function (el, i) {
        var body = bodies[i];
        var pos  = body.position;
        var r    = initialRects[i];
        el.style.left      = (pos.x - r.width / 2) + 'px';
        el.style.top       = (pos.y - r.height / 2) + 'px';
        el.style.transform = 'rotate(' + body.angle + 'rad)';
      });
      letterPairs.forEach(function (pair) {
        var pos = pair.body.position;
        pair.el.style.left      = (pos.x - pair.lw / 2) + 'px';
        pair.el.style.top       = (pos.y - pair.lh / 2) + 'px';
        pair.el.style.transform = 'rotate(' + pair.body.angle + 'rad)';
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
