/**
 * @fileoverview The base class for all Acorn behaviors.
 * @author vorporeal@gmail.com (David Stern)
 */

goog.provide('acorn.base.Behavior');



/**
 * The Behavior base class.  This provides the basic utilities that all
 * behaviors need to initialize and manage themselves.
 * @constructor
 */
acorn.base.Behavior = function() {

};


/**
 * Get the list of Components that an Entity must have to perform this
 * Behavior.
 * @return {Array.<string>} The names of the required Components.
 */
acorn.base.Behavior.prototype.getRequiredComponents = goog.abstractMethod;


/**
 * @return {number} The behavior's period.
 */
acorn.base.Behavior.prototype.getPeriod = function() {

};


/**
 * Set the behavior's period.
 * @param {number} period The behavior's period.
 * @return {acorn.base.Behavior} Return "this" for call chaining.
 */
acorn.base.Behavior.prototype.setPeriod = function(period) {

};


/**
 * @return {boolean} Whether or not the Behavior should be executed this tick.
 */
acorn.base.Behavior.prototype.shouldExecuteThisTick = function() {

};


/**
 * Execute this Behavior on all Entities that have it.
 */
acorn.base.Behavior.prototype.execute = function() {

};


/**
 * Apply this Behavior to an Entity.
 * @param {acorn.base.Entity} entity The entity to apply the Behavior to.
 */
acorn.base.Behavior.prototype.apply = goog.abstractMethod;
