/**
 * @fileoverview The Acorn entity class, comprising all in-game objects.
 * @author vorporeal@gmail.com (David Stern)
 */

goog.provide('acorn.base.Entity');



/**
 * The core object type in Acorn.  All objects are of type Entity, and are
 * functionally distinguished by the Components they have and the Behaviors that
 * apply to them.
 * @constructor
 */
acorn.base.Entity = function() {

};


/**
 * Check if this Entity supports a given behavior.
 * @param {acorn.base.Behavior} behavior The behavior to check for support with.
 * @return {boolean} True if this Entity contains the components required by the given
 *      behavior, false otherwise.
 */
acorn.base.Entity.prototype.supportsBehavior = function(behavior) {

};


/**
 * Attach a list of Behaviors to this Entity.
 * @param {Array.<acorn.base.Behavior>} behavior The Behaviors to attach.
 * @return {acorn.base.Entity} Return "this" to chain initialization calls.
 */
acorn.base.Entity.prototype.attachBehaviors = function(behaviors) {

};


/**
 * Attach a Behavior to this Entity.
 * @param {acorn.base.Behavior} behavior The Behavior to attach.
 * @return {acorn.base.Entity} Return "this" to chain initialization calls.
 */
acorn.base.Entity.prototype.attachBehavior = function(behavior) {

};


/**
 * Attach a list of Components to this Entity.
 * @param {Array.<acorn.base.Component>} components The Components to attach.
 * @return {acorn.base.Entity} Return "this" to chain initialization calls.
 */
acorn.base.Entity.prototype.attachComponents = function(components) {

};


/**
 * Attach a Component to this Entity.
 * @param {acorn.base.Component} component The Component to attach.
 * @return {acorn.base.Entity} Return "this" to chain initialization calls.
 */
acorn.base.Entity.prototype.attachComponent = function(component) {

};


/**
 * Check if this Entity contains a given Component.
 * @param {string} componentType The type of the Component.
 * @return True if this Entity has a Component of the given type, false
 *      otherwise.
 */
acorn.base.Entity.prototype.hasComponent = function(componentType) {

};
