var baredom = {};

if (typeof window !== 'undefined') {
  window.baredom = baredom;
}

// ## Main List Constructor

baredom.createList = function createList (target) {
  'use strict';
 
  // ### Declarations & State Initialization

  var dom = target.el;
  var collection = target.collection;

  // Two simple helper functions for default values
  // and fallbacks. 
  var fnoop = (function () {}),
      fcall = (function (f) { f(); });
  // Importing some math functions as well as the animation-frame
  // request/cancel mechanism.
  var min = Math.min, max = Math.max,
      floor = Math.floor, ceil = Math.ceil,
      w = window, r = 'equestAnimationFrame', c = 'ancelAnimationFrame',
      raf = w['r'+r] || w['mozR'+r] || w['webkitR'+r] || w['msR'+r] || fcall,
      caf = w['c'+c] || w['mozC'+c] || w['webkitC'+c] || w['msC'+c] || fnoop;
  // A `div` node as a wrapper for the individual nodes
  // and for setting the scroll height.
  var inner = dom.appendChild(document.createElement('div'));
  // The former contains a mapping of collection indexes
  // to used DOM Nodes, while `freeElements` is the stack
  // of unused nodes.
  var usedElements = {},
      freeElements = [];
  // Option values.
  var elementHeight = target.subviewHeight,
      overscroll    = target.subviewOverscroll || 0,
      createView    = target.createSubview || fnoop,
      renderView    = target.renderSubview || fnoop;
  // The currently displayed state of the scroll-area is
  // being held in these five variables.  We keep track of
  // the interval of rendered elements (with overscroll)
  // as well as of those who are currently visible on the screen.
  var scrollTop = 0,
      startIdx  = 0,
      endIdx    = 0,
      topi = floor(scrollTop / elementHeight),
      boti = ceil((scrollTop + dom.clientHeight) / elementHeight);
  // A reference to the current animation frame request. 
  var aframe;
  // We maintain statistics along the way to monitor behaviour
  // and performance. 
  var stats = {
    bufferLength:  0,
    displayLength: 0,
    eventCounter:  0,
    timer:         0
  };
  // Set the height of the wrapper element.
  inner.style.height = collection.length * elementHeight + 'px';

  // ### State Update Handler
  // To be called when the scroll state changes and an animation-frame
  // should be scheduled to re-render the scroll area.
  // The latter only happens if the amount scrolled is significant, i.e.
  // a previously hidden element will show up.
  var update = function update () {
    var page = floor(dom.clientHeight / elementHeight),
        topn = floor(dom.scrollTop / elementHeight),
        botn = ceil((dom.scrollTop + dom.clientHeight) / elementHeight);
    if (Math.abs(topn - topi) > page || Math.abs(botn - boti) > page) {
      topi = topn;
      boti = botn;
      caf(aframe);
      aframe = raf(render);
    }
  }

  // ### Element Hiding Loop
  // Transfers the elements in the interval onto
  // the free stack.
  var hide = function hide (start, end) {
    var i;
    for (i = start; i < end; i++) {
      freeElements.push(usedElements[i]);
      delete usedElements[i];
    }
  }

  // ### Element Showing Loop
  // Pops nodes off the free stack or creates a new
  // if the stack is empty, and then renders and positions
  // them on the scroll area, positions and order determined
  // by the interval given.
  var show = function show (start, end) {
    var i = start, el;
    for (; i < end && freeElements.length > 0; i++) {
      usedElements[i] = freeElements.pop();
    }
    for (; i < end; i++) {
      el = inner.appendChild(document.createElement('div'));
      usedElements[i] = {
        el: el,
        view: createView.call(target, el)
      };
      stats.bufferLength++;
    }
    for (i = start; i < end; i++) { renderView.call(target, i, usedElements[i].el, usedElements[i].view); }
    for (i = start; i < end; i++) { usedElements[i].el.style.top = i * elementHeight + 'px'; }
  }

  // ### Animation Frame Renderer
  // Calculates the indices of the elements to be incrementally
  // hidden or shown, then dispatches into the individual render logic.
  // Besides, updates stats and global state.
  // Because this function is called upon an animation frame request, it is
  // important to first read layout data from the DOM (eg. the scrollTop property)
  // and afterwards manipulate it.  Otherwise we will force a reflow in the browser.
  var render = function render () {
    var time = Date.now(),
        newStartIdx = max(topi - overscroll, 0),
        newEndIdx   = min(boti + overscroll, collection.length);
    scrollTop = dom.scrollTop;
    if (newStartIdx >= startIdx) {
      hide(startIdx, min(newStartIdx, endIdx));
      show(max(newStartIdx, endIdx), newEndIdx);
    } else {
      hide(max(newEndIdx, startIdx), endIdx);
      show(newStartIdx, min(newEndIdx, startIdx));
    }
    startIdx = newStartIdx;
    endIdx   = newEndIdx;
    stats.timer += Date.now() - time;
    stats.displayLength = endIdx - startIdx;
    stats.eventCounter++;
  }

  // Register the update handler for scroll and touchmove events.
  dom.addEventListener('scroll',    update);
  dom.addEventListener('touchmove', update);

  // Perform the initial rendering.
  update();
  render();

  return stats;

};
