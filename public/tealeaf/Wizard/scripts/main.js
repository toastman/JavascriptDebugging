/**
 * Licensed Materials - Property of IBM
 * © Copyright IBM Corp. 2014
 * US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global form2js, saveAs, document, window, alert*/
/*jshint loopfunc:true */
var configText;
(function (global, undefined) {
    "use strict";

    var doc = global.document,
        get = null,
        forEach = null,
        query = function (selector, scope) { return (scope || doc).querySelectorAll(selector); },
        attachAddMoreHandler = null,
		attachRemoveInstantlyHandler = null,
        createBlob = (function () {
            var prefixes = ["", "WebKit", "Moz", "MS"],
                i,
                len = prefixes.length,
                prefix,
                func = null,
                url_supported = (global.URL || global.webkitURL);
            if (typeof global.Blob === "function" && url_supported) {
                func = function (parts, type) {
                    return new global.Blob(parts, type);
                };
            } else if (url_supported) {
                for (i = 0; i < len; i += 1) {
                    prefix = prefixes[i];
                    if (typeof global[prefix + "BlobBuilder"] === "function") {
                        func = function (parts, type) {
                            var content = parts.join(""),
                                builder = new global[prefix + "BlobBuilder"]();
                            builder.append(content);
                            return builder.getBlob(type.type + ";charset=UTF-8");
                        };
                        break;
                    }
                }
            }
            return func;
        }()),
        language = "en",
        i18n = {
            en: {
                "site-title": "UIC Configuration Wizard",
                "page-headline": "UIC Configuration Wizard",
				"uic-version": "UIC Version ",
                "advanced-options": "Advanced Options",
                "btn-prev": "Previous",
                "btn-next": "Next",
                "btn-finish": "Finish",
                "btn-reset": "Reset to defaults",
                "btn-regextester": "RegEx Tester",

                "library-type-prod-min": "Production build (minified)",
                "library-type-prod": "Production build (non-minified)",
                "library-type-dev": "Development build (non-minified)",

                "browserService-header": "Browser Service Configuration",
                "browserService-subHeader": "Select a flavor:",
                "browserService-jQuery": "jQuery",
                "browserService-jQuery-helptext": "jQuery flavor is ONLY supported if the web app. uses jQuery 1.7 or above.",
                "browserService-jQuery-description": "The jQuery flavor of the UIC library uses jQuery API for cross-browser DOM access.",
                "browserService-w3c": "W3C",
                "browserService-w3c-helptext": "For everyone else.",
                "browserService-w3c-description": "The W3C flavor of the UIC library directly uses browser DOM APIs." +
                                                  "<br /><em>Note:</em> The W3C flavor requires the 3rd party Sizzle JS library to be included as well. Refer to the Sizzle URL section in the advanced options.",
                "browserService-sizzleURL": "Sizzle URL:",
                "browserService-sizzleURL-helptext": "Sizzle is required for the correct operation of the library in legacy IE browsers when using the W3C service. " +
                                                     "If your app. uses any version of jQuery, you don't need a separate Sizzle include since jQuery already includes Sizzle." +
                                                     "<br /><br />You can download Sizzle from http://sizzlejs.com/" +
                                                     "<br />Deployment options:" +
                                                     "<ol>" +
                                                     "<li>Static: Deploy Sizzle statically to your pages. When deploying statically, ensure the Sizzle library is included before the UIC library." +
                                                     "<li>Dynamic: Optionally, the UIC can include this library dynamically when needed. In this case, configure the URL setting here to point to the location on your server where the Sizzle library has been deployed." +
                                                     "</ol>",
                "browserService-sizzleObject": "Sizzle object",
                "browserService-sizzleObject-helptext": "Path to the Sizzle object. If skipped, window.Sizzle is used by default.",
                "browserService-jQueryObject": "jQuery object",
                "browserService-jQueryObject-helptext": "Path to the jQuery object. If skipped, window.jQuery is used by default.",
                "browserService-blacklistedElements": "Blacklisted elements:",
                "browserService-blacklistedElements-placeholder": "IDs or regular expressions separated by space comma space.",
                "browserService-blacklistedElements-helptext": "Blacklist any element IDs that are not unique and/or dynamically generated. Element IDs that match with any of the blacklisted entries will be replaced with custom attribute values or XPATH." +
                                                               "<br /><br />Tip: Use the RegEx tester to validate any regular expressions used to configure the blacklist.",
                "browserService-customID": "Custom attribute ID:",
                "browserService-customID-placeholder": "Attribute name.",
                "browserService-customID-helptext": "One or more attribute that can be used to uniquely identify an element when its HTML ID is not available or blacklisted.",
				"browserService-ieExcludedLinks": "Internet Explorer Excluded Links",
				"browserService-ieExcludedLinks-placeholder": "CSS selectors separated by commas.",
				"browserService-ieExcludedLinks-helptext": "This configuration is specified as an array of CSS selectors. For example, the configuration would be specified as: " +
															"ieExcludedLinks: ['a.ignore'], " +
															"to ignore the beforeunload triggered by the following link: < a href ='javascript:process();' class='ignore'>Click< /a>" +
															"<br/>If an invalid character (for example $) is specified and it is not properly escaped with \\ then an exception in Chrome and Webkit browsers will result.",
                "queueService-header": "Queue Service Configuration",
                "queueService-subHeader": "Configure the library's internal queue",
                "queueService-queueName": "Name:",
                "queueService-queueName-helptext": "Only one queue is supported in this release. The queue name MUST be 'DEFAULT'. Do not change this value.",
                "queueService-queueEndpoint": "Endpoint (Target page):",
                "queueService-queueEndpoint-helptext": "The target page URL on the webserver where the captured data will be posted. Cross-domain URLs are not supported in this release.",
                "queueService-queueSize": "Size (Max. Messages):",
                "queueService-queueSize-helptext": "The threshold after which the queue will be flushed. Recommended values are between 1-50 for testing and between 20-50 for a production deployment.",
                "queueService-queueTimer": "Timer interval:",
                "queueService-queueTimer-label": " seconds (use 0 seconds to disable the timer).",
                "queueService-queueTimer-helptext": "For enabling shadow browsing scenarios, you can set the timer value to periodically flush the queue irrespective of the number of messages. In most other cases, it's best to leave this setting disabled.",

                "queueService-crossDomainEnabled": "Enable cross-domain POST messages.",
                "queueService-crossDomainFrameSelector": "Cross domain frame selector:",
                "queueService-crossDomainFrameSelector-helptext": "The cross domain frame selector should specify the iframe or frame element on the page that has been configured to POST requests.",

				"queueService-asyncReqOnUnload": "Enable asynchronous XHR on page unload.",
				"queueService-asyncReqOnUnload-helptext": "Check this option to enable asynchronous request during page unload.<br />WARNING: Enabling asynchronous request on page unload may result in incomplete or missing data.",

                "queueService-queueSerializer": "Serializer:",
                "queueService-queueSerializer-JSON": "JSON",
                "queueService-queueSerializer-XML": "XML",
                "queueService-queueSerializer-helptext": "Only JSON serialization is supported.",
                "queueService-addQueue": "Add another queue",

                "messageService-header": "Message Service Configuration",
                "messageService-subHeader": "Privacy Masking Configuration",
                "messageService-targets": "Targets",
                "messageService-id": "ID:",
                "messageService-id-helptext": "HTML ID, XPath, or Custom Attribute ID ('attrName=attrValue') of the element which should be masked.",
                "messageService-idType": "IDType:",
                "messageService-idType--1": "HTML ID",
                "messageService-idType--2": "xPath",
                "messageService-idType--3": "Custom Attribute ID",
                "messageService-idType-helptext": "Select the correct ID type.",
                "messageService-addTarget": "Add another target",
                "messageService-maskType": "MaskType",
                "messageService-maskType-1": "Empty",
                "messageService-maskType-2": "Basic",
                "messageService-maskType-3": "Type",
                "messageService-maskType-4": "Custom",
                "messageService-maskType-helptext": "The MaskType defines how the value should get transformed." +
                                                    "<dl>" +
                                                        "<dt><b>Empty:</b></dt>" +
                                                        "<dd>The value gets set to an empty string.</dd>" +
                                                        "<dt><b>Basic:</b></dt>" +
                                                        "<dd>The value gets replaced with the fixed string: \"XXXXX\".</dd>" +
                                                        "<dt><b>Type:</b></dt>" +
                                                        "<dd>" +
                                                            "The value gets replaced by a mask where each:" +
                                                            "<ul>" +
                                                                "<li>lowercase character gets replaced by: \"x\",</li>" +
                                                                "<li>uppercase character gets replaced by: \"X\",</li>" +
                                                                "<li>number gets replaced by: \"9\",</li>" +
                                                                "<li>symbol gets replaced by: \"@\".</li>" +
                                                            "</ul>" +
                                                            "So the string: \"HelloWorld123\" becomes: \"XxxxxXxxxx999\"" +
                                                        "</dd>" +
                                                        "<dt><b>Custom:</b></dt>" +
                                                        "<dd>The value gets replaced by the return value of a custom function that needs to be written in the MaskFunction textbox.</dd>" +
                                                    "</dl>",
                "messageService-maskFunction": "Mask Function",
                "messageService-maskFunction-helptext": "JavaScript function that accepts an unmasked string and returns the masked value.",
                "messageService-addConfiguration": "Add privacy configuration",
				"messageService-cssSelector": "CSS Selector",
				"messageService-cssSelector-helptext": "Add a single CSS selector string",
				"services-message-privacy-cssSelector-placeholder": "Add CSS selector string here",
				"messageService-removePrivacyConfigurationTarget": "Remove Target",
				"messageService-removePrivacyConfiguration": "Remove Privacy Configuration",

                "serializer-header": "Serializer",
                "serializer-defaultToBuiltin": "Use built-in parser/serializer if none available",
                "serializer-defaultToBuiltin-helptext": "UIC comes with its own basic implementation of a JSON parser/serializer. The choice of the JSON parser/serializer is made as follows:<br />" +
                                                        "<ol>" +
                                                          "<li>If a JSON parser/serializer is explicitly specified in the configuration below, the UIC will use it." +
                                                          "<li>If no JSON parser/serializer is explicitly specified in the configuration below, the UIC will check to see if the browser has native support for JSON." +
                                                          "<li>If the browser does not support JSON natively and this checkbox is selected, the UIC will use it's basic implementation of JSON." +
                                                          "<li>If none of the above are applicable the UIC will fail silently." +
                                                        "</ol>",
                "serializer-parsers": "Parsers:",
                "serializer-parsers-helptext": "The list contains parser functions UIC should use (for example, JSON.parse). The first is most important. If UIC does not find it, it will try the next (if specified), and so on.",
                "serializer-parser": "Parser",
                "serializer-addParser": "Add another parser",
                "serializer-stringifiers": "Serializers:",
                "serializer-stringifiers-helptext": "The list contains serializer functions UIC should use (for example, JSON.stringify). The first is most important. If UIC does not find it, it will try the next (if specified), and so on.",
                "serializer-stringifier": "Serializer",
                "serializer-addStringifier": "Add another serializer",

				"encoder-header": "Encoder Sevice",
				"encoder": "Encoder",
				"encoder-enable": "Enable",
				"encoder-encode": "Encode",
				"encoder-defaultEncoding": "Default Encoding",
				"encoder-helptext": "Configure the compression encoder service. By default gzip is configured.",
				"encoder-defaultEncoding-helptext": "The encoding type that will be specified by the UIC in the HTTP request header. By default 'Content-encoding: gzip'.",
				"encoder-encode-helptext": "The path to the encoder. By default 'window.pako.gzip'.",

                "modules-header": "Modules",
                "modules-subHeader": "Select enabled modules",
                "modules-performance": "performance",
                "modules-performance-helptext": "W3C Navigation Timing properties",
                "modules-PerformanceSettings": "Performance Settings",
                "modules-replay": "replay",
                "modules-replay-helptext": "User interaction monitoring to enable replay, usability and step-based eventing.",
				"modules-overstat": "overstat",
				"modules-overstat-helptext": "Adds the mouseout, mousemove, and click overstat events to the configuration.",
                "modules-moduleBaseURL": "moduleBase URL:",
                "modules-moduleBaseURL-helptext": "Location on server from which modules that can be loaded dynamically. This option is not used in the current release.",
                "modules-replay-events": "Replay Events",
                "modules-hover-tracking": "Enable hover tracking",
                "modules-mobile-events": "Enable mobile events",
                "modules-hashchange": "Enable screenviews from hashchange",
                "modules-scroll-winsize": "Enable scroll and window size tracking",
				"modules-navigationStart-helptext": "This attribute must return the time immediately after the user agent finishes prompting to unload the previous document. If there is no previous document, this attribute must return the same value as fetchStart.",
				"modules-unloadEventStart-helptext": "If the previous document and the current document have the same origin [IETF RFC 6454], this attribute must return the time immediately before the user agent starts the unload event of the previous document. If there is no previous document or the previous document has a different origin than the current document, this attribute must return zero.",
				"modules-unloadEventEnd-helptext": "If the previous document and the current document have the same same origin, this attribute must return the time immediately after the user agent finishes the unload event of the previous document. If there is no previous document or the previous document has a different origin than the current document or the unload is not yet completed, this attribute must return zero. If there are HTTP redirects or equivalent when navigating and not all the redirects or equivalent are from the same origin, both unloadEventStart and unloadEventEnd must return the zero.",
				"modules-redirectStart-helptext": "If there are HTTP redirects or equivalent when navigating and if all the redirects or equivalent are from the same origin, this attribute must return the starting time of the fetch that initiates the redirect. Otherwise, this attribute must return zero.",
				"modules-redirectEnd-helptext": "If there are HTTP redirects or equivalent when navigating and all redirects and equivalents are from the same origin, this attribute must return the time immediately after receiving the last byte of the response of the last redirect. Otherwise, this attribute must return zero.",
				"modules-fetchStart-helptext": "If the new resource is to be fetched using HTTP GET or equivalent, fetchStart must return the time immediately before the user agent starts checking any relevant application caches. Otherwise, it must return the time when the user agent starts fetching the resource.",
				"modules-domainLookupStart-helptext": "This attribute must return the time immediately before the user agent starts the domain name lookup for the current document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return the same value as fetchStart.",
				"modules-domainLookupEnd-helptext": "This attribute must return the time immediately after the user agent finishes the domain name lookup for the current document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return the same value as fetchStart.",
				"modules-connectStart-helptext": "This attribute must return the time immediately before the user agent start establishing the connection to the server to retrieve the document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return value of domainLookupEnd.",
				"modules-connectEnd-helptext": "This attribute must return the time immediately after the user agent finishes establishing the connection to the server to retrieve the current document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return the value of domainLookupEnd. If the transport connection fails and the user agent reopens a connection, connectStart and connectEnd should return the corresponding values of the new connection. connectEnd must include the time interval to establish the transport connection as well as other time interval such as SSL handshake and SOCKS authentication.",
				"modules-secureConnectionStart-helptext": "This attribute is optional. User agents that don't have this attribute available must set it as undefined. When this attribute is available, if the scheme of the current page is HTTPS, this attribute must return the time immediately before the user agent starts the handshake process to secure the current connection. If this attribute is available but HTTPS is not used, this attribute must return zero.",
				"modules-requestStart-helptext": "This attribute must return the time immediately before the user agent starts requesting the current document from the server, or from relevant application caches or from local resources. If the transport connection fails after a request is sent and the user agent reopens a connection and resend the request, requestStart should return the corresponding values of the new request.",
				"modules-responseStart-helptext": "This attribute must return the time immediately after the user agent receives the first byte of the response from the server, or from relevant application caches or from local resources.",
				"modules-responseEnd-helptext": "This attribute must return the time immediately after the user agent receives the last byte of the current document or immediately before the transport connection is closed, whichever comes first. The document here can be received either from the server, relevant application caches or from local resources.",
				"modules-domLoading-helptext": "This attribute must return the time immediately before the user agent sets the current document readiness to 'loading'.",
				"modules-domInteractive-helptext": "This attribute must return the time immediately before the user agent sets the current document readiness to 'interactive'.",
				"modules-domContentLoadedEventStart-helptext": "This attribute must return the time immediately before the user agent fires the DOMContentLoaded event at the Document.",
				"modules-domContentLoadedEventEnd-helptext": "This attribute must return the time immediately after the document's DOMContentLoaded event completes.",
				"modules-domComplete-helptext": "This attribute must return the time immediately before the user agent sets the current document readiness to 'complete'. If the current document readiness changes to the same state multiple times, domLoading, domInteractive, domContentLoadedEventStart, domContentLoadedEventEnd and domComplete must return the time of the first occurrence of the corresponding document readiness change.",
				"modules-loadEventStart-helptext": "This attribute must return the time immediately before the load event of the current document is fired. It must return zero when the load event is not fired yet.",
				"modules-loadEventEnd-helptext": "This attribute must return the time when the load event of the current document is completed. It must return zero when the load event is not fired or is not completed.",
				"modules-mobile-events-helptext": "Enables replay of events from moblie sessions.",
				"modules-hashchange-helptext": "When enabled, this option generates screenview events when a hashchange has been identified in the URL of the page. A screenview event is inserted in the session data, and UI events captured by UI Capture can be organized beneath the screenview on which they occurred.",
				"modules-scroll-winsize-helptext": "NOTE: Depending on your application, tracking window scrolling can generate a significant number of events. Replay of scroll events captured from the client is supported for mobile sessions only in BBR only.",

                "performance-calculateRenderTime": "Calculate render time for browsers that do not support W3C Navigation Timing",
                "performance-calculateRenderTime-helptext": "Render time is calculated by measuring the time difference between page load and library load.",
                "performance-calculateRenderTime-description": "When this setting is enabled, the library will calculate render time as a difference between its load time and the page load time. For accurate measurements, ensure the library is loaded as early as possible in the page load cycle.",

				"replay-customEventName-placeholder": "Enter a single event name. e.g. mousedown",
				"replay-customEventTarget-placeholder": "Enter a CSS selector for the target element.",
				"replay-customEvent": "Custom Replay Event",
				"replay-customEvent-helptext": "Enter the CSS selector for the delegate target element OR document OR window",
				"replay-addCustomDelegate": "Add a Custom Replay Event",
				"replay-customEvent-name": "Event Name",
				"replay-customEvent-target": "Event Target",
				"replay-customEvent-name-helptext": "Enter the event name here. e.g. mousedown",
				"replay-customEvent-target-helptext": "Enter the CSS selector for the target element(s) OR document OR window",
				"replay-customEvent-delegateTarget": "Event Delegate Target (optional)",
				"replay-customEvent-delegateTarget-helptext": "Enter the CSS selector for the delegate target element OR document OR window. This setting is optional.",
				"replay-customEvent-recurseFrames": "Recurse Frames (optional)",
				"replay-customEvent-recurseFrames-helptext": "If checked, applies a listener for the event to the child frames/iframes of the document. This setting is optional.",
				"replay-removeCustomEvent": "Remove Custom Replay",

				"domCapture-header": "DOM Capture",
				"domCapture-enabled": "Enable DOM Capture",
				"domCapture-enabled-helptext": "Capture DOM snapshots. Specify a mandatory 'event' followed by one or more optional targets as well as an optional delay after which to take the DOM snapshot.",
				"domCapture-captureFrames": "Capture Frames",
				"domCapture-captureFrames-helptext": "If checked child frames and iframes will be captured.",
				"domCapture-removeScript": "Remove Script",
				"domCapture-removeScript-helptext": "If checked script tags be removed from the captured snapshot.",
				"domCapture-maxLength": "Max Length",
				"domCapture-maxLength-helptext": "If this threshold is exceeded, the snapshot will not be sent.",
				"domCapture-subHeader": "Add DOM Capture Triggers",
				"domCapture-trigger": "Trigger",
				"domCapture-addTrigger": "Add Trigger",
				"domCapture-event": "Event",
				"domCapture-event-helptext": "The available events are load, unload, click, or change.",
				"domCapture-screenview": "Screenview",
				"domCapture-addScreenview": "Add Screenview",
				"domCapture-removeScreenview": "Remove Screenview",
				"domCapture-delay": "Delay",
				"domCapture-delay-helptext": "Optional delay (in milliseconds) after which the DOM snapshot should be taken.",
				"domCapture-delay-placeholder": "Enter a number",
				"domCapture-removeTrigger": "Remove Trigger",
				"domCapture-addTarget": "Add Target",
				"domCapture-removeTarget": "Remove Target",
				"domCapture-target": "Target",
				"domCapture-target-id": "ID",
				"domCapture-target-id-helptext": "ID of the target as the specified of the three ID types.",
				"domCapture-target-idType": "ID Type",
				"domCapture-target-idType-helptext": "HTML ID, XPath, or Custom ID of the element.",
				"domCapture-target-cssSelector": "CSS Selector",
				"domCapture-target-cssSelector-helptext": "Add a single CSS selector string.",

                "misc-header": "Miscellaneous Settings",
                "sessionData-options": "Session Data sharing options",
                "sessionData-Enable": "Share session data",
                "sessionData-Enable-description": "Selecting this option will enable sharing of session data with other scripts on the page. Please refer to the documentation for details.",
                "sessionData-Enable-helptext": "Selecting this option will enable sharing of session data with other scripts on the page. Please refer to the documentation for details.",
                "sessionId-Cookie": "Cookie",
                "sessionId-Cookie-description": "Select this option if a cookie is used for sessionization.",
                "sessionId-Cookie-helptext": "Select this option if a cookie is used for sessionization.",
                "sessionId-Query": "Query Parameter",
                "sessionId-Query-description": "Select this option if a query parameter is used for sessionization.",
                "sessionId-Query-helptext": "Select this option if a query parameter is used for sessionization.",
                "sessionId-Cookie-Name": "Cookie Name",
                "sessionId-Cookie-Name-helptext": "The name of the cookie being used for sessionization. For example, TLTSID, jsessionid, and so on.",
                "sessionId-Query-Name": "Query Parameter Name",
                "sessionId-Query-Name-helptext": "The name (i.e. LHS) of the query parameter being used for sessionization.",
                "sessionId-Query-Delimiter": "Query string delimiter",
                "sessionId-Query-Delimiter-helptext": "Specify the query string delimiter that is being used by the application. Default is &",
                "sessionId-ValueNeedsHashing": "Value needs hashing",
                "sessionId-ValueNeedsHashingDescription": "Select this option if the value needs to be hashed to derive the Session ID.",
                "misc-frames-blacklist-label": "Blacklisted frames",
                "misc-frames-blacklist-helptext": "CSS selectors of frames excluded from data collection.",
                "misc-frames-blacklist-placeholder": "CSS selectors separated by space comma space.",

                "regextester-headline": "Test your regular expressions",
                "regextester-regex": "RegEx",
                "regextester-flag-i": "Case insensitive (i)",
                "regextester-flag-g": "Global (g)",
                "regextester-sample": "Test Sample",
                "regextester-matches": "Matches?",
                "regextester-copylabel": "(ready for copy&paste into config)",
                "regextester-btn-test": "Test",

                "unsupported-header": "Unfortunately your browser is either too old or not supported.",
                "unsupported-sudHeader": "Please use one of the following browsers:",
                "unsupported-infotext": "",
                "unsupported-firefox-versioninfo": "(Version 17.0 and above)",
                "unsupported-safari-versioninfo": "(Version 6.0 and above)",

				"validation-timerinterval": "Timer interval is not valid, please input a non-negative number less than 120",
				"validation-maxevents": "Max events is not valid, please input a number above zero and less than 100"
            }
        };

    try {
        get = doc.getElementById.bind(doc);
        forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
    } catch (e) { }


    function sibling(node, direction) {
        var siblingNode = node[direction + "Sibling"];
        while (siblingNode && siblingNode.nodeType !== 1) {
            siblingNode = siblingNode[direction + "Sibling"];
        }
        return siblingNode || false;
    }

    function nextSlide(slide) {
        var next = sibling(slide, "next"),
            retVal = null;
        if (next !== null) {
            slide.classList.toggle("in");
            slide.classList.toggle("out");
            next.classList.toggle("in");
            retVal = next;
        }
        return retVal;
    }
    function prevSlide(slide) {
        var prev = sibling(slide, "previous"),
            retVal = null;
        if (prev !== null) {
            slide.classList.toggle("in");
            prev.classList.toggle("out");
            prev.classList.toggle("in");
            retVal = prev;
        }
        return retVal;
    }

    function addDataBinding(node) {
        node.addEventListener("change", function (e) {
            var id = e.target.id,
                displays = query("." + id);
            forEach(displays, function (display) {
                var value = e.target.value;
                if (display.dataset.replaceLangKey) {
                    value = i18n[language][display.dataset.replaceLangKey + "-" + value];
                }
                display.textContent = value;
            });
        }, false);
    }

    function replaceNumberTokens(element, token, replacement) {
        var html = element.outerHTML,
            regex = new RegExp("{n" + token + "}", "g");
        html = html.replace(regex, replacement);
        element.outerHTML = html;
    }

    function setNameAttributes(scope) {
        var elements = query("[data-name]", scope);
        forEach(elements, function (element) {
            var name = element.dataset.name;
            element.name = name;
            element.removeAttribute("data-name");
        });
    }

	function removeTemplate(e, target) {
		if (typeof e.preventDefault === "function") {
            e.preventDefault();
        }
		var idLink = (target || e.target).id,
			idElement = idLink.replace("-removeTarget", ""),
			element = document.getElementById(idElement);
		element.parentNode.removeChild(element);
	}

    function addTemplate(e, target) {
        if (typeof e.preventDefault === "function") {
            e.preventDefault();
        }
        var id = (target || e.target).dataset.id,
            template = get(id),
			radix = 10,
            idCounter,
            newId,
            replacementToken = (target || e.target).dataset.replacementToken,
            newElement = template.cloneNode(true),
            node,
			replayConfiguration = document.getElementById("config-modules-replay-filter-configuration"),
			replayDelegateTarget,
			replayDelegateTargetLabel,
			replayDelegateTargetSpan,
			replayRecurseFramesTarget,
			selectData,
			selectTarget,
			inputs,
			oldValue,
			i;
		template.dataset.idCounter = (parseInt(template.dataset.idCounter, radix) + 1);
		idCounter = parseInt(template.dataset.idCounter, radix);
		newId = id + "-" + idCounter;
        newElement.classList.remove("template");
        newElement.id = newId;
        newElement.removeAttribute("data-id-counter");
        if (newElement.tagName === "DETAILS") {
            newElement.open = true;
        }
        setNameAttributes(newElement);
        template.parentNode.appendChild(newElement);
        node = sibling(template.parentNode.lastChild, "previous");
        while (node) {
            if (node.tagName === "DETAILS") {
                node.open = false;
            }
            node = sibling(template, "previous");
        }
        replaceNumberTokens(get(newId), replacementToken, idCounter);
        addDataBinding(get(newId));
        forEach(query(".add-more", get(newId)), function (link) {
            attachAddMoreHandler(link);
            if (link.classList.contains("add-instantly")) {
                addTemplate({}, link);
            }
        });
		forEach(query(".remove-instantly", get(newId)), function (link) {
            attachRemoveInstantlyHandler(link);
        });
		if (id === "config-modules-replay-filter-configuration") {
			replayRecurseFramesTarget = document.getElementsByName("config.core.modules.replay.events.custom[" + idCounter + "].recurseFrames")[0];
			replayRecurseFramesTarget.addEventListener("change", function (ev) {
				if (ev.target.checked) {
					replayRecurseFramesTarget.value = "true";
				} else {
					replayRecurseFramesTarget.value = "false";
				}
			}, false);

			if (document.getElementById("browserService-w3c").checked) {
				for (i = 0; i <= idCounter; i += 1) {
					replayDelegateTargetSpan = document.getElementById("config-modules-replay-filter-" + i + "-delegateTarget-span");
					replayDelegateTarget = document.getElementById("config-modules-replay-filter-" + i + "-delegateTarget");
					replayDelegateTargetLabel = document.getElementById("config-modules-replay-filter-" + i + "-delegateTarget-label");
					if (replayDelegateTarget) {
						replayDelegateTargetSpan.style.display = "none";
						replayDelegateTarget.style.display = "none";
						replayDelegateTargetLabel.style.display = "none";
					}
				}
			}
		}
		selectData = document.getElementById("config-modules-replay-domCapture-filter-" + idCounter + "-event");
		//Handle changes to the HTML when a user changes an option in a specified select
		if (selectData) {
			oldValue = "load";
			selectData.addEventListener("change", function (ev) {
				selectTarget = get(selectData.dataset.select + "-" + oldValue);
				inputs = query("input, select, textarea", selectTarget);
				forEach(inputs, function (input) {
					input.disabled = true;
					input.style.display = "none";
				});
				selectTarget = get(selectData.dataset.select + "-" + ev.target.value);
				inputs = query("input, select, textarea", selectTarget);
				forEach(inputs, function (input) {
					input.disabled = false;
					input.style.display = "block";
				});
				var partialId = ev.target.id.match("config-(.*)event")[1],
					target = document.getElementById(partialId + ev.target.value);
				forEach(query("[data-selectoption]"), function (select) {
					if (select.dataset.selectoption.match("[0-9]+")[0] === target.dataset.selectoption.match("[0-9]+")[0]) {
						if (select.dataset.selectoption === target.dataset.selectoption) {
							select.style.display = "block";
							select.disabled = false;
						} else {
							select.style.display = "none";
							select.disabled = true;
						}
					}
				}, false);
				oldValue = ev.target.value;
			});
		}
    }

    attachAddMoreHandler = function (link) {
        link.addEventListener("click", addTemplate, false);
    };

	attachRemoveInstantlyHandler = function (link) {
        link.addEventListener("click", removeTemplate, false);
    };

    function setInputStates(node, state) {
        forEach(node.childNodes, function (node) {
            node.disabled = state;
        });
    }

    function localize(element) {
        var innerHTML = element.innerHTML,
            key,
            regex;
        for (key in i18n[language]) {
            if (i18n[language].hasOwnProperty(key)) {
                regex = new RegExp("{{\\s?" + key + "\\s?}}", "g");
                innerHTML = innerHTML.replace(regex, i18n[language][key]);
            }
        }
        element.innerHTML = innerHTML;
    }

    function getNodesValue(nodes) {
        return Array.prototype.reduce.call(nodes, function (prev, input) {
            if (input.value) {
                if (prev !== "") {
                    prev += ", ";
                }
                prev += input.value;
            }

            return prev;
        }, "");
    }

	function validateTimerInterval() {
		var timerInterval = document.getElementById("services-queue-0-timerinterval").value,
			timerIntervalIsDigit = /^\d+$/.test(timerInterval);
		if (timerIntervalIsDigit) {
			if (parseFloat(timerInterval) < 120) {
				return true;
			}
			alert(i18n[language]["validation-timerinterval"]);
			return false;

		}
		alert(i18n[language]["validation-timerinterval"]);
		return false;

	}
	function validateMaxEvents() {
		var maxEvents = document.getElementById("services-queue-0-maxEvents").value,
			maxEventsIsDigit = /^\d+$/.test(maxEvents);
		if (maxEventsIsDigit) {
			if (parseFloat(maxEvents) < 100 && parseFloat(maxEvents) > 0) {
				return true;
			}
			alert(i18n[language]["validation-maxevents"]);
			return false;
		}
		alert(i18n[language]["validation-maxevents"]);
		return false;
	}
	function validateInputs() {
		//To be extended as more input validation functions are written
		var isTimerIntervalTrue = validateTimerInterval(),
			isMaxEventsTrue = validateMaxEvents();

		if (isTimerIntervalTrue && isMaxEventsTrue) {
			return true;
		}
		return false;
	}

    function init() {

        get("main-container").style.height = window.innerHeight - 4 + "px";

        doc.title = i18n[language]["site-title"];

        forEach(query(".data-bindings"), addDataBinding);
        forEach(query(".add-more"), attachAddMoreHandler);

        addTemplate({}, get('services-serializer-addParser'));
        addTemplate({}, get('services-serializer-addStringifier'));

        query(".services-message-privacy-configurations")[0].addEventListener("change", function (e) {
            var id, option, functionDef;
            if (e.target.classList.contains("services-message-privacy-target")) {
                id = e.target.dataset.privacyConfigId;
                query(".services-message-privacy-" + id + "-targets")[0].innerText =
                    getNodesValue(query(".services-message-privacy-target-" + id));
            } else if (e.target.classList.contains("services-message-privacy-maskType")) {
                option = e.target.value;
                functionDef = query(".services-message-privacy-maskFunctionDefinition", e.target.parentNode.parentNode);
                if (option === "4") {
                    forEach(functionDef, function (el) {
                        var textarea = query(".escapedFunction", el)[0];
                        el.style.display = "block";
                        if (textarea) {
                            textarea.disabled = false;
                        }
                    });
                } else {
                    forEach(functionDef, function (el) {
                        var textarea = query(".escapedFunction", el)[0];
                        el.style.display = "none";
                        if (textarea) {
                            textarea.disabled = true;
                        }
                    });
                }
            }
        }, false);

        query(".services-serializer")[0].addEventListener("change", function (e) {
            if (e.target.classList.contains("services-serializer-parsers")) {
                query(".services-serializer-parsers-values")[0].innerText =
                    getNodesValue(query(".services-serializer-parsers"));
            } else if (e.target.classList.contains("services-serializer-stringifiers")) {
                query(".services-serializer-stringifiers-values")[0].innerText =
                    getNodesValue(query(".services-serializer-stringifiers"));
            }
        });

        forEach(query("[data-toggles]"), function (checkbox) {
			var target = get(checkbox.dataset.toggles),
				inputs = query("input, select, textarea", target);
			checkbox.addEventListener("change", function (ev) {
				if (ev.target.checked) {
					target.style.display = "block";
					forEach(inputs, function (input) { input.disabled = false; });
				} else {
					target.style.display = "none";
					forEach(inputs, function (input) { input.disabled = true; });
				}
			}, false);
        });

        forEach(query(".sessionIdChoice"), function (radio) {
            var cookieContainer = get("misc-sessionId-Cookie-container"),
                queryContainer = get("misc-sessionId-Query-container"),
                cookieInputs = query("input, select, textarea", cookieContainer),
                queryInputs = query("input, select, textarea", queryContainer);

            radio.addEventListener("change", function (ev) {
                if (ev.target.value === "Cookie") {
                    // Enable the cookie container, disable the cookie container
                    cookieContainer.style.display = "block";
                    queryContainer.style.display = "none";
                    forEach(cookieInputs, function (input) { input.disabled = false; });
                    forEach(queryInputs, function (input) { input.disabled = true; });
                } else {
                    // Enable the query container, disable the cookie container
                    queryContainer.style.display = "block";
                    cookieContainer.style.display = "none";
                    forEach(queryInputs, function (input) { input.disabled = false; });
                    forEach(cookieInputs, function (input) { input.disabled = true; });
                }
            }, false);
        });

        query(".core-modules-replay-events")[0].addEventListener("change", function (e) {
            setInputStates(query("." + e.target.id)[0], !e.target.checked);
        }, false);

        forEach(query(".browserService"), function (checkbox) {
            var w3cContainer = get("services-browser-sizzleURL-container"),
                w3cInputs = query("input, select, textarea", w3cContainer),
                jQueryContainer = get("services-browser-jQuery-container"),
                jQueryInputs = query("input, select, textarea", jQueryContainer),
				i = 0,
				replayDelegateTarget,
				replayDelegateTargetLabel,
				replayDelegateTargetSpan,
				replayConfiguration = document.getElementById("config-modules-replay-filter-configuration");

            checkbox.addEventListener("change", function (ev) {
                if (ev.target.value === "w3c") {
                    w3cContainer.style.display = "block";
                    forEach(w3cInputs, function (input) { input.disabled = false; });
                    // Disable jQuery service specific options
                    jQueryContainer.style.display = "none";
                    forEach(jQueryInputs, function (input) { input.disabled = true; });
					for (i = 0; i <= replayConfiguration.dataset.idCounter; i += 1) {
						replayDelegateTargetSpan = document.getElementById("config-modules-replay-filter-" + i + "-delegateTarget-span");
						replayDelegateTarget = document.getElementById("config-modules-replay-filter-" + i + "-delegateTarget");
						replayDelegateTargetLabel = document.getElementById("config-modules-replay-filter-" + i + "-delegateTarget-label");
						if (replayDelegateTarget) {
							replayDelegateTargetSpan.style.display = "none";
							replayDelegateTarget.style.display = "none";
							replayDelegateTargetLabel.style.display = "none";
						}
					}
                } else {
                    jQueryContainer.style.display = "block";
                    forEach(jQueryInputs, function (input) { input.disabled = false; });
                    // Disable W3C service specific options
                    w3cContainer.style.display = "none";
                    forEach(w3cInputs, function (input) { input.disabled = true; });
					for (i = 0; i <= replayConfiguration.dataset.idCounter; i += 1) {
						replayDelegateTargetSpan = document.getElementById("config-modules-replay-filter-" + i + "-delegateTarget-span");
						replayDelegateTarget = document.getElementById("config-modules-replay-filter-" + i + "-delegateTarget");
						replayDelegateTargetLabel = document.getElementById("config-modules-replay-filter-" + i + "-delegateTarget-label");
						if (replayDelegateTarget) {
							replayDelegateTargetSpan.style.display = "inline";
							replayDelegateTarget.style.display = "block";
							replayDelegateTargetLabel.style.display = "block";
						}
					}
                }
            }, false);
        });

        get("btn-prev").addEventListener("click", function (e) {
            e.preventDefault();
            var curr = query(".in")[0],
                prev = prevSlide(curr);
            if (!sibling(sibling(curr, "previous"), "previous")) {
                this.setAttribute("disabled", "disabled");
            } else {
                this.removeAttribute("disabled");
            }
            get("btn-next").removeAttribute("disabled");
        }, false);


        get("btn-next").addEventListener("click", function (e) {
            e.preventDefault();
            var curr = query(".in")[0],
                next = nextSlide(curr);
            if (!sibling(sibling(curr, "next"), "next")) {
                this.setAttribute("disabled", "disabled");
            } else {
                this.removeAttribute("disabled");
            }
            get("btn-prev").removeAttribute("disabled");
        }, false);

		function generateConfig() {
			var functions = {},
				form,
				is_w3c,
				libraryType,
				changeTarget,
				config,
				i,
				j,
				k,
				cssSelectorString,
				privacy,
				len,
				propertyName,
				processedStr,
				regEx;
			forEach(query(".escapedFunction"), function (textarea) {
				functions[textarea.id] = textarea.value;
			});
			form = form2js(get("configwizard-form"));
			is_w3c = form.browserService === "w3c";
			changeTarget = is_w3c ? get("UIC-SDK-FILE-changetarget").textContent : "var changeTarget;\n";
			libraryType = get("library-type").value;
			if (form.config.core.ieExcludedLinks) {
				form.config.core.ieExcludedLinks = form.config.core.ieExcludedLinks.split(",");
			}
			if (form.config.services.browser && form.config.services.browser.blacklist) {
					// Need to split by "space comma space" to not split at commas in JSON objects.
				form.config.services.browser.blacklist = form.config.services.browser.blacklist.split(" , ");
				forEach(form.config.services.browser.blacklist, function (blacklisted, i) {
					if (blacklisted[0] === "{") {
						blacklisted = JSON.parse(blacklisted);
						form.config.services.browser.blacklist[i] = blacklisted;
					}
				});
			}
			if (form.config.services.message && form.config.services.message.privacy) {
				for (i = form.config.services.message.privacy.length - 1; i >= 0; i -= 1) {
					privacy = form.config.services.message.privacy[i];
					if (privacy.targets) {
						privacy.targets = privacy.targets.filter(function (target) {
							return target.id !== undefined || target.cssSelector !== undefined;
						});
						for (j = privacy.targets.length - 1; j >= 0; j -= 1) {
							if (privacy.targets[j].cssSelector !== undefined) {
								privacy.targets.push(privacy.targets[j].cssSelector);
								delete privacy.targets[j].cssSelector;
							}
							if (typeof privacy.targets[j].id !== typeof privacy.targets[j].idType) {
								privacy.targets.splice(j, 1);
							}
						}
					}
					if (privacy.targets.length === 0) {
						form.config.services.message.privacy.splice(i, 1);
					}
				}
				if (form.config.services.message.privacy.length === 0) {
					delete form.config.services.message;
				}
			}
			if (form.config.services.serializer && form.config.services.serializer.json) {
				if (!form.config.services.serializer.json.defaultToBuiltin) {
					form.config.services.serializer.json.defaultToBuiltin = false;
				}
				if (!form.config.services.serializer.json.parsers) {
					form.config.services.serializer.json.parsers = [];
				} else {
					for (i = form.config.services.serializer.json.parsers.length - 1; i >= 0; i -= 1) {
						if (form.config.services.serializer.json.parsers[i].length === 0) {
							form.config.services.serializer.json.parsers.splice(i, 1);
						}
					}
				}
				if (!form.config.services.serializer.json.stringifiers) {
					form.config.services.serializer.json.stringifiers = [];
				} else {
					for (i = form.config.services.serializer.json.stringifiers.length - 1; i >= 0; i -= 1) {
						if (form.config.services.serializer.json.stringifiers[i].length === 0) {
							form.config.services.serializer.json.stringifiers.splice(i, 1);
						}
					}
				}
			}
			if (form.config.core.modules) {
				if (form.config.core.modules.replay) {
					if (form.config.core.modules.replay.events) {
						if (form.config.core.modules.replay.events.custom) {
							form.config.core.modules.replay.events.custom.forEach(function (replayDelegate) {
								if (replayDelegate.name && replayDelegate.target) {
									if (!replayDelegate.recurseFrames) {
										replayDelegate.recurseFrames = false;
									}
									if (is_w3c) {
										delete replayDelegate.delegateTarget;
										form.config.core.modules.replay.events.push(replayDelegate);
									} else {
										form.config.core.modules.replay.events.push(replayDelegate);
									}
								}
							});
							delete form.config.core.modules.replay.events.custom;
						}
					}
				}
			}
			if (form.config.modules) {
				if (form.config.modules.replay) {
					if (form.config.modules.replay.domCapture) {
						if (!form.config.modules.replay.domCapture.enabled) {
							delete form.config.modules.replay.domCapture;
						}
					}
					if (form.config.modules.replay.domCapture) {
						if (form.config.modules.replay.domCapture.triggers) {
							for (i = 0; i < form.config.modules.replay.domCapture.triggers.length; i += 1) {
								if (form.config.modules.replay.domCapture.triggers[i].event === "click" || form.config.modules.replay.domCapture.triggers[i].event === "change") {
									if (form.config.modules.replay.domCapture.triggers[i].targets) {
										for (j = 0; j < form.config.modules.replay.domCapture.triggers[i].targets.length; j += 1) {
											if (typeof form.config.modules.replay.domCapture.triggers[i].targets[j] !== "string") {
												if (!form.config.modules.replay.domCapture.triggers[i].targets[j].id  && !form.config.modules.replay.domCapture.triggers[i].targets[j].cssSelector) {
													//delete the target if idType is specified but no ID or CSS Selector is specified
													form.config.modules.replay.domCapture.triggers[i].targets.splice(j, 1);
													//subtract one from j because targets becomes one smaller
													j -= 1;
												} else {
													if (form.config.modules.replay.domCapture.triggers[i].targets[j].cssSelector) {
														//the css selector should be a string in the target array, not part of the object cssSelctor
														cssSelectorString = form.config.modules.replay.domCapture.triggers[i].targets[j].cssSelector;
														delete form.config.modules.replay.domCapture.triggers[i].targets[j].cssSelector;
														form.config.modules.replay.domCapture.triggers[i].targets.push(cssSelectorString);
													}
													if (!form.config.modules.replay.domCapture.triggers[i].targets[j].id) {
														//delete the target if idType is specified but no ID is specified after having moved the cssSelector
														form.config.modules.replay.domCapture.triggers[i].targets.splice(j, 1);
														//subtract one from j because targets becomes one smaller
														j -= 1;
													}
												}
											}
										}
									}
								} else if (form.config.modules.replay.domCapture.triggers[i].event === "unload" || form.config.modules.replay.domCapture.triggers[i].event === "load") {
									if (form.config.modules.replay.domCapture.triggers[i].targets) {
										//remove targets from unload and load events, load and unload events only have screenviews
										delete form.config.modules.replay.domCapture.triggers[i].targets;
									}
								}
								if (form.config.modules.replay.domCapture.triggers[i].targets) {
									if (form.config.modules.replay.domCapture.triggers[i].targets.length === 0 || form.config.modules.replay.domCapture.triggers[i].targets === undefined) {
										delete form.config.modules.replay.domCapture.triggers[i].targets;
									}
								}
							}
						}
						if (form.config.modules.replay.domCapture.options) {
							if (!form.config.modules.replay.domCapture.options.captureFrames) {
								form.config.modules.replay.domCapture.options.captureFrames = false;
							}
							if (!form.config.modules.replay.domCapture.options.removeScript) {
								form.config.modules.replay.domCapture.options.removeScript = false;
							}
						}
					}
				}
			}
			if (!form.config.services.queue.asyncReqOnUnload) {
				form.config.services.queue.asyncReqOnUnload = false;
			}
			if (form.config.core.framesBlacklist) {
				form.config.core.framesBlacklist = form.config.core.framesBlacklist.split(" , ");
			}
			//add the encoder to the queue configuration
			if (form.config.services.encoder) {
				//currently only gzip is supported and currently the config wiz only configures one queue named DEFAULT
				form.config.services.queue.queues[0].encoder = "gzip";
			}

			// Stringify 'beautiful' (with two spaces indentation) if it is a development build.
			config = JSON.stringify(form.config, null, (libraryType === "-prod" || libraryType === "-dev" ? 2 : 0))
				.replace(/"(window||document||changeTarget||true||false||\d+)"/g, "$1");
			for (propertyName in functions) {
				if (functions.hasOwnProperty(propertyName)) {
					RegExp.handleSpecialChars = function (str) {
						return str.replace(/[\[\^\$\.\|\?\*\+\(\)]/g, "\\$&");
					};
					RegExp.handleBackSlash = function (str) {
						return str.replace(/[\\]/g, "\\\\\\$&");
					};
					RegExp.handleNewLine = function (str) {
						return str.replace(/(\n|\r)/g, "\\\\n");
					};
					processedStr = RegExp.handleNewLine(RegExp.handleSpecialChars(RegExp.handleBackSlash(functions[propertyName])));
					regEx = new RegExp("\"" + processedStr + "\"", "g");
					functions[propertyName] = functions[propertyName].replace(/(\n|\r)/g, " ");
					config = config.replace(regEx, function (match) {
						return functions[propertyName];
					});
				}
			}
			return config;
		}

		configText = function writeConfig() {
			return generateConfig();
        };

        get("btn-finish").addEventListener("click", function (e) {
            e.preventDefault();
			if (validateInputs()) {
				var SDK,
					form,
					libraryType,
					is_w3c,
					intro,
					outro,
					changeTarget,
					blob;
				form = form2js(get("configwizard-form"));
				libraryType = get("library-type").value;
				SDK = get("UIC-SDK-FILE-" + form.browserService + libraryType).textContent;
				is_w3c = form.browserService === "w3c";
				intro = is_w3c ? "(function () {" : "";
				outro = is_w3c ? "\n}());" : "";
				changeTarget = is_w3c ? get("UIC-SDK-FILE-changetarget").textContent : "var changeTarget;\n";
				// Use application/octet-stream to force download.
				blob = createBlob([SDK, "\n", intro, changeTarget, "TLT.init(" + generateConfig() + ");", outro], { type: "application/javascript" });
				saveAs(blob, "tealeaf-" + form.browserService + libraryType + ".js");
			}
		}, false);

        get("btn-reset").addEventListener("click", function (e) {
			var i,
				j,
				k,
				privacyConfiguration = document.getElementById("messageService-privacyconfiguration"),
				parserConfiguration = document.getElementById("services-serializer-parsers-template"),
				serializerConfiguration = document.getElementById("services-serializer-stringifiers-template"),
				replayConfiguration = document.getElementById("config-modules-replay-filter-configuration"),
				domConfiguration = document.getElementById("config-modules-replay-domCapture-filter-configuration");
            e.preventDefault();
            get("configwizard-form").reset();
			forEach(query("[data-toggles]"), function (checkbox) {
				var target = get(checkbox.dataset.toggles),
					inputs = query("input, select, textarea", target);
				if (checkbox.checked) {
					target.style.display = "block";
					forEach(inputs, function (input) {
						input.disabled = false;
					});
				} else {
					target.style.display = "none";
					forEach(inputs, function (input) {
						input.disabled = true;
					});
				}
			});
			privacyConfiguration.dataset.idCounter = 0;
			while (privacyConfiguration.nextElementSibling !== null) {
				privacyConfiguration.nextElementSibling.parentNode.removeChild(privacyConfiguration.nextElementSibling);
			}
			document.getElementById("service-serializer-parsers-values").innerHTML = "";
			while (parserConfiguration.nextElementSibling !== null) {
				parserConfiguration.nextElementSibling.parentNode.removeChild(parserConfiguration.nextElementSibling);
			}
			document.getElementById("service-serializer-stringifiers-values").innerHTML = "";
			while (serializerConfiguration.nextElementSibling !== null) {
				serializerConfiguration.nextElementSibling.parentNode.removeChild(serializerConfiguration.nextElementSibling);
			}
			replayConfiguration.dataset.idCounter = 0;
			while (replayConfiguration.nextElementSibling !== null) {
				replayConfiguration.nextElementSibling.parentNode.removeChild(replayConfiguration.nextElementSibling);
			}
			domConfiguration.dataset.idCounter = 0;
			while (domConfiguration.nextElementSibling !== null) {
				domConfiguration.nextElementSibling.parentNode.removeChild(domConfiguration.nextElementSibling);
			}
			this.setAttribute("disabled", "disabled");
        }, false);
        get("configwizard-form").addEventListener("change", function (e) {
            get("btn-reset").removeAttribute("disabled");
            if (e.target.classList.contains("browserService")) {
                get("btn-finish").removeAttribute("disabled");
            }
        }, false);

        get("btn-regextester").addEventListener("click", function (e) {
            get("regextester").classList.toggle("visible");
        }, false);

		get("close-regex").addEventListener("click", function (e) {
            get("regextester").classList.toggle("visible");
        }, false);

        get("btn-testregex").addEventListener("click", function (e) {
            var regexStr = get("regextester-regex").value,
                flagI = get("regextester-flag-i"),
                flagG = get("regextester-flag-g"),
                flags = (flagI.checked ? "i" : "") + (flagG.checked ? "g" : ""),
                sample = get("regextester-sample").value,
                output = get("regextester-output"),
                copyoutput = get("regextester-copyregex"),
                regex,
                test;
            if (flags === "") {
                flags = undefined;
            }
            regex = new RegExp(regexStr, flags);
            test = regex.test(sample);
            copyoutput.value = JSON.stringify({ regex: regex.source, flags: flags });
            copyoutput.focus();
            copyoutput.select();
            if (test) {
                output.classList.remove("regextester-no-match");
                output.classList.add("regextester-match");
                output.innerHTML = "true";
            } else {
                output.classList.add("regextester-no-match");
                output.classList.remove("regextester-match");
                output.innerHTML = "false";
            }
        }, false);

    }

    try {
        (function () {
            var testElement = doc.createElement("a"),
                supportsQuerySelectorAll = doc.querySelectorAll !== undefined,
                supportsDataSet = testElement && (testElement.hasOwnProperty("dataset") || !!testElement.dataset),
                supportsClassList = testElement && (testElement.hasOwnProperty("classList") || !!testElement.classList),
                supportsw3cEvents = typeof window.addEventListener === "function",
                supportsForEach = typeof Array.prototype.forEach === "function",
                supportsBlob = typeof createBlob === "function",
                supportsBind = typeof Function.prototype.bind === "function",
				isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;
            if (!supportsQuerySelectorAll || !supportsDataSet || !supportsClassList || !supportsw3cEvents || !supportsForEach || !supportsBlob || !supportsBind) {
                throw { message: "Browser not supported!", code: "NOTSUPPORTED" };
            }
			if (isFirefox) {
				if (navigator.userAgent.split("Firefox/")[1] < 17) {
					throw { message: "Browser not supported!", code: "NOTSUPPORTED" };
				}
			}
        }());

        localize(get("main-container"));
        init();
    } catch (e2) {
        localize(doc.getElementById("notsupported"));
        doc.getElementById("main-container").style.display = "none";
        doc.getElementById("notsupported").style.display = "block";
    }

}(this));