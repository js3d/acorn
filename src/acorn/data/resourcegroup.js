/**
 * @author David Stern (vorporeal@gmail.com)
 */

goog.provide('acorn.data.ResourceGroup');

goog.require('acorn.util.Trackable');
goog.require('goog.async.DeferredList');



/**
 * @param {Array.<acorn.base.Resource>} resources
 * @constructor
 * @extends {goog.async.DeferredList}
 * @implements {acorn.util.Trackable}
 */
acorn.data.ResourceGroup = function(resources) {
  goog.base(this, resources, false, true);
  
  /**
   * The number of resources to load.
   * @type {number}
   * @private
   */
  this.numResources_ = resources.length;
  
  /**
   * How many resources have successfully loaded.
   * @type {number}
   * @private
   */
  this.numLoadedResources_ = 0;
  
  for (var i = 0; i < resources.length; i++) {
    var r = resources[i];
    // On successful load, call this.resourceLoaded_, passing it the resource.
    r.addCallback(goog.bind(this.resourceLoaded_, this));
  }
};
goog.inherits(acorn.data.ResourceGroup, goog.async.DeferredList);


/**
 * Process a resource that loaded successfully.
 * 
 * @param {boolean} resource The loaded resource.
 * @return {acorn.base.Resource} The result, to be handled by the next handler
 *     in the deferred's callback chain (if any).
 * @private
 */
acorn.data.ResourceGroup.prototype.resourceLoaded_ = function(resource) {
  this.numLoadedResources_++;
  return resource;
};


/**
 * Load all of the resources in this group.
 */
acorn.data.ResourceGroup.prototype.load = function() {
  // TODO (vorporeal): Finish implementing this.
};


/** @override */
acorn.data.ResourceGroup.prototype.getMinimum = function() {
  return 0;
};


/** @override */
acorn.data.ResourceGroup.prototype.getMaximum = function() {
  return this.numResources_;
};


/** @override */
acorn.data.ResourceGroup.prototype.getValue = function() {
  return this.numLoadedResources_;
};
