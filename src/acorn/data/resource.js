/**
 * @author David Stern (vorporeal@gmail.com)
 */

goog.provide('acorn.data.Resource');

goog.require('goog.async.Deferred');



/**
 * @param {string} name The name of the resource.
 * @param {string|goog.Uri} uri The URI at which this resource can be found.
 * @constructor
 * @extends {goog.async.Deferred}
 */
acorn.data.Resource = function(name, uri) {
  goog.base(this);
  
  /**
   * The name of this resource.
   * @type {string}
   * @protected
   */
  this.name = name;
  
  /**
   * The URI at which this resource can be found.
   * @type {string}
   * @protected
   */
  this.uri = uri;
  
  /**
   * Whether this resource has been loaded.
   * @type {boolean}
   * @protected
   */
  this.loaded = false;
};
goog.inherits(acorn.data.Resource, goog.async.Deferred);


/**
 * Attempt to load this resource.
 */
acorn.data.Resource.prototype.load = goog.abstractMethod;


/**
 * @return {string} The name of the resource.
 */
acorn.data.Resource.prototype.getName = function() {
  return this.name;
};


/**
 * @return {string} The URI at which this resource is located.
 */
acorn.data.Resource.prototype.getUri = function() {
  return this.uri;
};


/**
 * @return {boolean} Whether this resource has been loaded.
 */
acorn.data.Resource.prototype.isLoaded = function() {
  return this.loaded;
};
