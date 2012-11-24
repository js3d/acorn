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
 * Set up class-level properties of a Behavior.
 * @param {Object} behavior The Behavior class to set up.
 */
acorn.base.Behavior.initialize = function(behavior) {
  goog.addSingletonGetter(behavior);
  behavior.getBehaviorId = goog.partial(goog.getUid, behavior);
  behavior.prototype.getBehaviorId = behavior.getBehaviorId;
};


/**
 * Compare the IDs of two Behaviors.
 * @param {acorn.base.Behavior} a The first Behavior.
 * @param {acorn.base.Behavior} b The second Behavior.
 * @return {number} 1 if a>b, -1 if a<b, 0 otherwise.
 */
acorn.base.Behavior.compare = function(a, b) {
  var aId = a.getBehaviorId();
  var bId = b.getBehaviorId();

  return aId > bId ? 1 : aId < bId ? -1 : 0;
};


/**
 * Get the list of Components that an Entity must have to perform this
 * Behavior.
 * @return {Array.<Object>} A list of the types of all required Components.
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
  // TODO (vorporeal): Figure out how I want to implement this.
  return this;
};


/**
 * @return {boolean} Whether or not the Behavior should be executed this tick.
 */
acorn.base.Behavior.prototype.shouldExecuteThisTick = function() {
  return true;
};


/**
 * Execute this Behavior on all Entities that have it.
 */
acorn.base.Behavior.prototype.execute = function() {
  //goog.array.forEach(<ENTITY LIST>, this.apply, this);
};


/**
 * Apply this Behavior to an Entity.
 * @param {acorn.base.Entity} entity The entity to apply the Behavior to.
 */
acorn.base.Behavior.prototype.apply = goog.abstractMethod;
