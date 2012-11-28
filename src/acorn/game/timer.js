/**
 * @fileoverview The implementation of a simple timer class.
 * @author vorporeal@gmail.com (David Stern)
 */

goog.provide('acorn.game.Timer');



/**
 * A simple timer that can be used to monitor the frame times for a game loop.
 * @constructor
 */
acorn.game.Timer = function() {
  
  /**
   * The time at which this frame started.
   * @type {number}
   */
  this.now = goog.now();

  /**
   * The time at which the last frame started.
   * @type {number}
   */
  this.then = this.now;
};


/**
 * Mark the beginning of a frame.
 */
acorn.game.Timer.prototype.beginFrame = function() {
  this.then = this.now;
  this.now = goog.now();
};


/**
 * Get the length of the last frame (the dT to be used for this frame).
 * @return {number} The length of the last frame, in seconds.
 */
acorn.game.Timer.prototype.getDeltaT = function() {
  return (this.now - this.then) / 1000;
};
