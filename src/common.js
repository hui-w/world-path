/** 
 * @author Wang, Hui (huiwang@qlike.com) 
 * @repo https://github.com/hui-w/world-path/
 * @licence MIT
 */

'use strict';
var Consts = {
    KeyIndex: 0,
    CountryIndex: 1,
    LatLonIndex: 4,
    LabelIndex: 5,
    LevelIndex: 6
};

var Config = {
    keyboard: {
        changeUnit: 40,
        timerDelay: 50
    },

    Toolbar: {
        navUnit: 20,
        navTimerDelay: 50,
        zoomTimerDelay: 100,
        marginTop: 16,
        marginLeft: 8,
        marginRight: 8,
        marginBottom: 16,
        buttonSpacing: 8,
        buttonPadding: 8,
        buttonSize: 48
    },

    Map: {
        maxScale: 30,
        minScale: 0.5,
        moveTimerDelay: 50,
        moveDuration: 800,
        zoomTimerDelay: 50
    },

    colors: [
        "#37C719", "#E66C0F", "#D5312C", "#1B2258", "#E62760", "#3051EA"
    ],

    colorIndex: 0
};

// Should be executed BEFORE any hash change has occurred.
(function(namespace) { // Closure to protect local variable "var hash"
    if ('replaceState' in history) { // Yay, supported!
        namespace.replaceHash = function(newhash) {
            if (('' + newhash).charAt(0) !== '#') newhash = '#' + newhash;
            history.replaceState('', '', newhash);
        }
    } else {
        var hash = location.hash;
        namespace.replaceHash = function(newhash) {
            if (location.hash !== hash) history.back();
            location.hash = newhash;
        };
    }
})(window);

var Util = {
    $: function() {
        var elements = new Array();
        for (var i = 0; i < arguments.length; i++) {
            var element = arguments[i];
            if (typeof element == 'string')
                element = document.getElementById(element);
            if (arguments.length == 1)
                return element;
            elements.push(element);
        }
        return elements;
    },

    getQueryStringByName: function(name, url) {
        if (url == null) {
            url = location.search;
        }
        var result = url.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));
        if (result == null || result.length < 1) {
            return null;
        } else {
            return result[1];
        }
    },

    setUrlHash: function(name, value) {
        var hash = window.location.hash;
        if (hash.length <= 0) {
            //init
            window.location.hash = name + "=" + value;
        } else {
            var pattern = name + "=([^\&]+)";
            var result = hash.match(new RegExp(pattern, "i"));
            var newHash = hash;
            if (result == null || result.length < 1) {
                newHash = hash + "&" + name + "=" + value;
            } else {
                newHash = hash.replace(new RegExp(pattern, "i"), name + "=" + value);
            }

            // this will affect browser history
            // window.replaceHash(newHash);

            history.replaceState(undefined, undefined, newHash)
        }
    },

    getUrlHash: function(name, url) {
        if (url == null) {
            url = window.location.hash;
        }
        var result = url.match(new RegExp("[\#\&]" + name + "=([^\&]+)", "i"));
        if (result == null || result.length < 1) {
            return null;
        } else {
            return result[1];
        }
    },

    isNull: function(o) {
        return o == 'undefined' || o == null;
    },

    is: function(o, type) {
        type = String.prototype.toLowerCase.call(type);
        if (type == "finite") {
            return isFinite(o);
        }
        if (type == "array" &&
            (o instanceof Array || Array.isArray && Array.isArray(o))) {
            return true;
        }
        return (type == "null" && o === null) ||
            (type == typeof o && o !== null) ||
            (type == "object" && o === Object(o)) ||
            Object.prototype.toString.call(o).slice(8, -1).toLowerCase() == type;
    },

    format_str: (function() {
        var tokenRegex = /\{([^\}]+)\}/g,
            objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, // matches .xxxxx or ["xxxxx"] to run over object properties
            replacer = function(all, key, obj) {
                var res = obj;
                key.replace(objNotationRegex, function(all, name, quote, quotedName, isFunc) {
                    name = name || quotedName;
                    if (res) {
                        if (name in res) {
                            res = res[name];
                        }
                        typeof res == "function" && isFunc && (res = res());
                    }
                });
                res = (res == null || res == obj ? all : res) + "";
                return res;
            };
        return function(str, obj) {
            return String(str).replace(tokenRegex, function(all, key) {
                return replacer(all, key, obj);
            });
        };
    })()
};

var Browser = {
    versions: function() {
            var u = navigator.userAgent,
                app = navigator.appVersion;
            return {
                trident: u.indexOf('Trident') > -1, //IE Core
                presto: u.indexOf('Presto') > -1, //Opera Core
                webKit: u.indexOf('AppleWebKit') > -1, //Apple, Google Core
                gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //Firefox Core
                mobile: !!u.match(/AppleWebKit.*Mobile.*/), //Is Mobile
                ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //iOS
                android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android or uc browser
                iPhone: u.indexOf('iPhone') > -1, //iPhone or QQHD browser
                iPad: u.indexOf('iPad') > -1, //iPad
                webApp: u.indexOf('Safari') == -1 //web App
            };
        }
        (),
    language: (navigator.browserLanguage || navigator.language).toLowerCase()
};

Element.prototype.attr = function(params, value) {
    if (!params) {
        if (this.nodeType != 1) {
            return {
                text: this.nodeValue
            };
        }
        var attr = this.attributes,
            out = {};
        for (var i = 0, ii = attr.length; i < ii; i++) {
            out[attr[i].nodeName] = attr[i].nodeValue;
        }
        return out;
    }
    if (Util.is(params, "string")) {
        if (arguments.length > 1) {
            var json = {};
            json[params] = value;
            params = json;
        } else {
            return this.getAttribute(params);
        }
    }
    for (var att in params) {
        if (params["hasOwnProperty"](att)) {
            this.setAttribute(att, params[att]);
        }
    }
    return this;
};

Element.prototype.createChildNS = function(tag, param, textContent, addToFirst) {
    var svgns = "http://www.w3.org/2000/svg";
    var element = document.createElementNS(svgns, tag);
    if (addToFirst && this.hasChildNodes()) {
        this.insertBefore(element, this.firstChild);
    } else {
        this.appendChild(element);
    }
    if (param) {
        for (var key in param) {
            element.setAttribute(key, param[key]);
        }
    }
    if (textContent) {
        //fix the bug for Safari
        //element.appendChild(document.createTextNode(textContent));
        element.textContent = textContent;
    }

    return element;
};

Element.prototype.getStyle = function(key) {
    var style = this.getAttribute("style");
    if (style != null && style.trim().length > 0) {
        var keyValuePairs = style.split(";");
        for (var i = 0; i < keyValuePairs.length && keyValuePairs[i].trim().length > 0; i++) {
            var keyAndValue = keyValuePairs[i].split(":");
            if (keyAndValue.length != 2) {
                continue;
            }
            if (key == keyAndValue[0].trim()) {
                return keyAndValue[1].trim();
            }
        }
    }
    return null;
};

Element.prototype.updateStyle = function(key, value) {
    var oldStyle = this.getAttribute("style");
    var keyExisting = false;
    var newStyle = "";
    if (oldStyle != null && oldStyle.trim().length > 0) {
        var keyValuePairs = oldStyle.split(";");
        for (var i = 0; i < keyValuePairs.length && keyValuePairs[i].trim().length > 0; i++) {
            var keyAndValue = keyValuePairs[i].split(":");
            if (keyAndValue.length != 2) {
                continue;
            }
            if (key == keyAndValue[0].trim()) {
                //apply new value to the key
                keyExisting = true;
                if (value != null) {
                    newStyle += key + ": " + value + "; ";
                } else {
                    //the value is set as null
                }
            } else {
                //other style key and value
                newStyle += keyAndValue[0].trim() + ": " + keyAndValue[1].trim() + "; ";
            }
        }
    }
    if (!keyExisting) {
        //append to the end
        newStyle += key + ": " + value + "; ";
    }
    this.setAttribute("style", newStyle)
};

Array.prototype.each = function(func, param) {
    var items = this.findItem(param);
    for (var i = 0; i < items.length; i++) {
        if (typeof func == "function") {
            func.call(items[i]);
        }
    }
};

String.prototype.format = function() {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g,
        function(m, i) {
            return args[i];
        });
};