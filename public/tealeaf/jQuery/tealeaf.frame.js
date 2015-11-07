/*!
 * Licensed Materials - Property of IBM
 * © Copyright IBM Corp. 2014
 * US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

var TLT = (function () {
    'use strict';

    var serviceCreators = {},
        services = {},
        isInitialized = false;

    function _init() {
        isInitialized = true;
    }

    function destroy() {
        var serviceName,
            service;

        for (serviceName in services) {
            if (services.hasOwnProperty(serviceName)) {
                service = services[serviceName];

                if (service && typeof service.destroy === "function") {
                    service.destroy();
                }

                delete services[serviceName];
            }
        }
    }

    return {
        browserApi: (function () {
            if (typeof document.addEventListener === 'function') {
                return {
                    addEventListener: function (target, eventName, handler) {
                        target.addEventListener(eventName, handler, false);
                    },
                    removeEventListener: function (target, eventName, handler) {
                        target.removeEventListener(eventName, handler, false);
                    }
                };
            }

            if (document.attachEvent) {
                return {
                    addEventListener: function (target, eventName, handler) {
                        target.attachEvent('on' + eventName, handler);
                    },
                    removeEventListener: function (target, eventName, handler) {
                        target.detachEvent('on' + eventName, handler);
                    }
                };
            }

            throw new Error("Unsupported browser");
        }()),

        addService: function (name, creator) {
            serviceCreators[name] = creator;
        },

        getService: function (name) {
            var service = null;

            if (name && serviceCreators[name]) {
                service = serviceCreators[name](this);
                services[name] = service;
                if (typeof service.init === "function") {
                    service.init();
                }
            }

            return service;
        },

        init: function () {
            if (!isInitialized) {
                this.getService("xdomain");
                _init();
            }
        },

        destroy: function () {
            if (isInitialized) {
                destroy();
            }
        }
    };
}());

(function () {
    'use strict';

    if (typeof document.addEventListener === 'function') {
        window.addEventListener("load", function () {
            TLT.init();
        }, false);
    } else if (typeof document.attachEvent !== 'undefined') {
        window.attachEvent("onload", function () {
            TLT.init();
        });
    } else {
        throw new Error("Unsupported browser");
    }
}());
/**
 * Licensed Materials - Property of IBM
 * © Copyright IBM Corp. 2014
 * US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global TLT:true, window: true, ActiveXObject */

/**
 * @name ajaxService
 * @namespace
 */
TLT.addService("ajax", function (core) {
    "use strict";

    var getXHRObject,
		convertHeaders = function (headersObj) {
            var header = "",
                headers = [];
            for (header in headersObj) {
                if (headersObj.hasOwnProperty(header)) {
                    headers.push([header, headersObj[header]]);
                }
            }
            return headers;
        },
		isInitialized = false;

    /**
     * Builds an object of key => value pairs of HTTP headers from a string.
     * @param  {String} headers The string of HTTP headers separated by newlines
     *      (i.e.: "Content-Type: text/html\nLast-Modified: ..")
     * @return {Object}         Returns an object where every key is a header
     *     and every value it's correspondending value.
     */
    function extractResponseHeaders(headers) {
        headers = headers.split('\n');
        var headersObj = {},
            i = 0,
            len = headers.length,
            header = null;
        for (i = 0; i < len; i += 1) {
            header = headers[i].split(': ');
            headersObj[header[0]] = header[1];
        }
        return headersObj;
    }

    /**
     * @private
     * @function
     * @name ajaxService-makeAjaxCall
     * @see browserService.sendRequest
     */
    function makeAjaxCall(message) {
        var xhr = getXHRObject(),
            headers = [["X-Requested-With", "XMLHttpRequest"]],
            timeout = 0,
            async = typeof message.async !== "boolean" ? true : message.async,
            header = "",
            callbackFn = null,
            i,
            length;

        if (message.headers) {
            headers = headers.concat(convertHeaders(message.headers));
        }
        if (message.contentType) {
            headers.push(["Content-Type", message.contentType]);
        }
        xhr.open(message.type.toUpperCase(), message.url, async);

        for (i = 0, length = headers.length; i < length; i += 1) {
            header = headers[i];
            if (header[0] && header[1]) {
                xhr.setRequestHeader(header[0], header[1]);
            }
        }

        xhr.onreadystatechange = callbackFn = function () {
            if (xhr.readyState === 4) {
                xhr.onreadystatechange = callbackFn = function () {};
                if (message.timeout) {
                    window.clearTimeout(timeout);
                }
                message.oncomplete({
                    headers: extractResponseHeaders(xhr.getAllResponseHeaders()),
                    responseText: (xhr.responseText || null),
                    statusCode: xhr.status,
                    success: (xhr.status === 200)
                });
                xhr = null;
            }
        };

        xhr.send(message.data || null);
        callbackFn();

        if (message.timeout) {
            timeout = window.setTimeout(function () {
                if (!xhr) {
                    return;
                }

                xhr.onreadystatechange = function () {};
                if (xhr.readyState !== 4) {
                    xhr.abort();
                }
                xhr = null;
            }, message.timeout);
        }
    }

    function initAjaxService() {
		if (typeof window.XMLHttpRequest !== 'undefined') {
            getXHRObject = function () {
                return new XMLHttpRequest();
            };
        } else {
            getXHRObject = function () {
                return new ActiveXObject("Microsoft.XMLHTTP");
            };
        }

		isInitialized = true;
    }

    return {
        convertHeaders: convertHeaders,
        extractResponseHeaders: extractResponseHeaders,
		init: function () {
			if (!isInitialized) {
                initAjaxService();
            }
		},

		/**
         * Destroys service state
         */
        destroy: function () {
            isInitialized = false;
        },

		/**
         * Makes an Ajax request to the server.
         * @param {Object} message An AjaxRequest object containing all the information
         *     neccessary for making the request.
         * @param {String} [message.contentType] Set to a string to override the default
         *     content type of the request.
         * @param {String} [message.data] A string containing data to POST to the server.
         * @param {Object} [message.headers] An object whose properties represent HTTP headers.
         * @param {Function} message.oncomplete A callback function to call when the
         *     request has completed.
         * @param {Integer} [message.timeout] The number of milliseconds to wait
         *     for a response before closing the Ajax request.
         * @param {String} [message.type="POST"] Either 'GET' or 'POST',
         *     indicating the type of the request to make.
         * @param {String} message.url The URL to send the request to.
         *     This should contain any required query string parameters.
         */
        sendRequest: function (message) {
            message.type = message.type || "POST";
            makeAjaxCall(message);
        }
    };
});
/**
 * Licensed Materials - Property of IBM
 * © Copyright IBM Corp. 2014
 * US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global TLT:true, window: true */

/**
 * @name xdomainService
 * @namespace
 */
TLT.addService("xdomain", function (core) {
    "use strict";

    var isInitialized = false,
        addEventListener = null,
        removeEventListener = null,
        ajaxService = core.getService("ajax");

    function receiveMessage(event) {
        var request;

        if (typeof event !== "undefined" && typeof event.data !== "undefined" && typeof event.data.request !== "undefined") {
            request = event.data.request;

            if (typeof request.url !== "undefined" && typeof request.async !== "undefined" && typeof request.headers !== "undefined" && typeof request.data !== "undefined") {
                ajaxService.sendRequest({
                    oncomplete: function () {},
                    url: request.url,
                    async: request.async,
                    headers: request.headers,
                    data: request.data
                });
            }
        }
    }

    function initXDomainService() {
        var isIE = false;
        /*@cc_on
            isIE = true;
        @*/

        if (!isIE && typeof window.postMessage === "function") {
            core.browserApi.addEventListener(window, "message", receiveMessage);
        } else {
            window.sendMessage = function (event) {
                if (event) {
                    receiveMessage({
                        data: event
                    });
                }
            };
        }
    }

    function destroy() {
        core.browserApi.removeEventListener(window, "message", receiveMessage);
    }

    return {
        init: function () {
            if (!isInitialized) {
                initXDomainService();
            }
        },

        /**
         * Destroys service state
         */
        destroy: function () {
            destroy();
            isInitialized = false;
        }
    };
});
