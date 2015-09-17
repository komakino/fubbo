(function(context){
    context = context || this;
    context.Class = function Class(properties){
        // Grab special properties
        var construct   = _grab(properties,'$construct')   || new Function(),
            parent      = _grab(properties,'$extend')      || Class,
            mixin       = _grab(properties,'$mixin')       || [],
            describe    = _grab(properties,'$describe'),
            errors      = _grab(properties,'$errors');

        // Set up lineage
        construct.$lineage = parent.$lineage ? _clone(parent.$lineage) : [];
        construct.$lineage.push(parent);


        // Prototyping
        function temp() { this.constructor = construct; }
        temp.prototype = parent.prototype;
        construct.prototype = new temp;

        // Relation methods
        construct.$childOf     = function(parent){ return this.$lineage && this.$lineage.indexOf(parent) > -1;}
        construct.$parentOf    = function(parent){ return parent.$lineage && parent.$lineage.indexOf(this) > -1;}
        construct.$parent      = parent;

        // Create error classes
        construct.$error = {};
        if(errors){
            for(name in errors) {
                if(!errors.hasOwnProperty(name)) continue;
                construct.$error[name] = (typeof errors[name] == 'function') ? errors[name] : _createError(name,errors[name]);
            }
        }

        // Apply properties and mixins
        typeof mixin == 'array' || (mixin = [mixin]);
        mixin.push(properties);
        if(mixin){
            mixin.map(function(m){
                if(typeof m == 'function') 'prototype' in m && _merge(construct.prototype,m.prototype);
                else if(typeof m == 'object') _merge(construct.prototype,m);
            });
        }

        // Define properties
        describe && 'defineProperties' in Object && Object.defineProperties(construct.prototype,describe);

        return construct;
    }

    function _merge(a,b){ for(v in b) b.hasOwnProperty(v) && (a[v] = _clone(b[v]))}
    function _clone(value){
        if (value === null || value === undefined) return value;
        switch(true){
            case (value.constructor === Array): return Array.prototype.slice.call(value);
            case (typeof value === 'object'): return JSON.parse(JSON.stringify(value));
            default: return value;
        }
    }
    function _grab(obj,prop){
        var temp = obj[prop];
        delete obj[prop]
        return temp;
    }
    function _createError(name,defaultMessage){
        return Class({
            $extend: Error,
            $construct: function(message){
                Error.call(this);
                this.name = name;
                this.message = message || defaultMessage;
            },
        })
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Class;
    } else {
        return Class;
    }
})();