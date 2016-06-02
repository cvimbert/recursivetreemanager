/**
 * Created by Christophe on 02/06/2016.
 */
(function(factory) {
    var root = (typeof self == 'object' && self.self === self && self) ||
        (typeof global == 'object' && global.global === global && global);

    if (typeof define === 'function' && define.amd) {
        define(function() {
            return factory();
        });
    } else {
        root.RecursiveTreeManager = factory();
    }
})(function() {

    return function(datas) {

    }
});