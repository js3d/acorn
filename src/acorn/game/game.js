/**
 * @fileoverview The class encapsulating the main game loop.
 * @author vorporeal@gmail.com (David Stern)
 */

goog.provide('acorn.game.Game');

goog.require('acorn.game.Timer');



/**
 * This class encapsulates the whole game.  It contains both the entry point
 * from the browser, and the main game loop.
 * @constructor
 */
acorn.game.Game = function() {

  /**
   * A timer to keep track of frame lengths.
   * @type {acorn.game.Timer}
   */
  this.timer = new acorn.game.Timer();

  /**
   * The desired frame rate to run the game at.
   * @type {number}
   * @protected
   */
  this.frameRate = 60;
};


/**
 * Request another call to loop_ after a delay.
 * TODO (vorporeal): Review polyfill on http://bit.ly/fxq7EY
 * @private
 */
acorn.game.Game.prototype.waitForFrame_ = (function() {
  var rAF = window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame;
  return rAF ? goog.bind(rAF, window) : function (callback) {
    // TODO (vorporeal): Don't hardcode 60fps.
    window.setTimeout(callback, 1000 / 60);
  };
})();


/**
 * This function should be called at the end of subclass constructors to
 * initialize the game and start the game loop.
 * @protected
 */
acorn.game.Game.prototype.start = function() {
  this.timer.beginFrame();
  this.waitForFrame_(goog.bind(this.loop_, this));
};


/**
 * The main game loop.
 * @private
 */
acorn.game.Game.prototype.loop_ = function() {
  this.timer.beginFrame();
  this.waitForFrame_(goog.bind(this.loop_, this));

  this.tick();
};


/**
 * Tick.
 * @protected
 */
acorn.game.Game.prototype.tick = goog.abstractMethod;
