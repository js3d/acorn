/**
 * @author David Stern (vorporeal@gmail.com)
 */

goog.provide('acorn.util.Trackable');



/**
 * An operation with progress that can be tracked.
 * @interface
 */
acorn.util.Trackable = function() {};


/**
 * @return {number} The minimum possible amount of progress.
 */
acorn.util.Trackable.prototype.getMinimum = function() {};


/**
 * @return {number} The maximum possible amount of progress.
 */
acorn.util.Trackable.prototype.getMaximum = function() {};


/**
 * @return {number} The current amount of progress.
 */
acorn.util.Trackable.prototype.getValue = function() {};
