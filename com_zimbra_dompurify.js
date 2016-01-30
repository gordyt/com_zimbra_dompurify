/**
 * widget handler
 */


function com_zimbra_dompurify_handler () {
    var com_zimbra_dompurity_XMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = function (params) {
        var request = new com_zimbra_dompurity_XMLHttpRequest(params);
        var published = {};
        var response = undefined;
        var responseOverridden = false;
        var responseText = undefined;
        var responseTextOverridden = false;
        for (var k in request) {
            if (k !== "response" && k !== "reponseText") {
                if (typeof request[k] === "function") {
                    published[k] = request[k].bind(request);
                }
                else {
                    Object.defineProperty(published, k, {
                        get: function () {
                            return request[k];
                        },
                        set: function (val) {
                            request[k] = val;
                        },
                        enumerable: true,
                        configurable: true
                    });
                }
            }
        }

        Object.defineProperty(published, 'response', {
            get: function () {
                if (responseOverridden) {
                    return response;
                }
                else {
                    return request.response;
                }
            },
            set: function (newResponse) {
                response = newResponse;
                responseOverridden = true;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(published, 'responseText', {
            get: function () {
                if (responseTextOverridden) {
                    return responseText;
                }
                else {
                    return request.responseText;
                }
            },
            set: function (newResponseText) {
                responseText = newResponseText;
                responseTextOverridden = true;
            },
            enumerable: true,
            configurable: true
        });
        return published;
    };

    /**
     * Return the first element named elem starting with root.
     * This is a recursive function.
     * Returns: undefined if cannot locate.
     */
    var findElement = function (root, elem) {
        Object.keys(root).forEach(function (k) {
            if (k === elem) {
               return root[k];
            }
            else if (typeof root[k] === "object") {
                return findElement(root[k], elem);
            }
        });
        return undefined;
    };

    var sanitizeMessageParts = function (mp) {
        return mp.map(function (v, i, a) {
            if (v.ct === "text/html" && v.content) {
                if (v.content._content) {
                    v.content._content = DOMPurify.sanitize(v.content._content);
                }
                else {
                    v.content = DOMPurify.sanitize(v.content);
                }
            }
            else if (v.mp) {
                v.mp = sanitizeMessageParts(v.mp);
            }
            return v;
        });
    };

    /**
     * Recursively search through the supplied argument and
     * look for any mp arrays that are embedded in an m or 
     * inside another mp array.  Sanitize any elements whose
     * ct is "text.html"
     */
    var sanitizeTextHtml = function (j) {
        var message = findElement(j, "m");
        if (message !== undefined) {
            var messageParts = findElement(message, "mp");
            if (messageParts !== undefined) {
                messageParts = sanitizeMessageParts(messagePart);
            }
        }

        return j;
    };

    /**
     * Sanitize the responseText in an XMLHttpReqest, then call the supplied
     * callback.
     * Parameters:
     *   cb - The client's callback function
     *   evt - the event
     */

    var sanitizeResponseText = function (cb, evt) {
        if (this.readyState === XMLHttpRequest.DONE) {
            if (this.responseType === "" || this.responseType === "text" ) {
                try {
                    var oldResponse = JSON.parse(this.response);
                    if (oldResponse.Body && (oldResponse.Body.GetMsgResponse || oldResponse.Body.GetConvResponse ||
                        oldResponse.Body.SearchConvResponse)) {
                        this.response = JSON.stringify(sanitizeTextHtml(oldResponse));
                        this.responseText = this.response;
                    }
                }
                catch (err) {
                    console.log("sanitizeResponseText: err=" + err);
                }
            }
        }
        cb.call(this, evt);
    };


    /**
     * preprocess text/html message parts to ensure the HTML is clean
     *    {
     *      "Body": {
     *        "SendMsgRequest": {
     *          "m": {
     *            "mp": [
     *               {
     *                 "content": {
     *                   "_content": "....."
     *                 },
     *                 "ct": "CONTENT/TYPE"
     *               },
     *               ...
     */

    var sanitizeSendMsgRequest = function (data) {
        console.log("sanitizeSendMsgRequest");
        try {
            var j = JSON.parse(data);
            if (j.Body && j.Body.SendMsgRequest && j.Body.SendMsgRequest.m && j.Body.SendMsgRequest.m.mp) {
                var mpOrig = j.Body.SendMsgRequest.m.mp;
                var mpClean = mpOrig.map(function (v, i, a) {
                    if (v.ct === "text/html" && v.content && v.content._content) {
                        v.content._content = DOMPurify.sanitize(v.content._content);
                    }
                    return v;
                });
                j.Body.SendMsgRequest.m.mp = mpClean;
            }
            return JSON.stringify(j);
        }
        catch (err) {
            return data;
        }
    }


    // pre-process what is sent with an XMLHttpRequest
    var saveSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        console.log("dompurify.send: arguments.length='" + arguments.length + "'");
        if (arguments.length > 0) {
            arguments[0] = sanitizeSendMsgRequest(arguments[0]);
        }
        var saveOnReadyStateChange = this.onreadystatechange;
        if (saveOnReadyStateChange) {
            this.onreadystatechange = sanitizeResponseText.bind(this, saveOnReadyStateChange);
        }
        saveSend.apply(this, arguments);
    };
}

com_zimbra_dompurify_handler.prototype = new ZmZimletBase();
com_zimbra_dompurify_handler.prototype.constructor = com_zimbra_dompurify_handler;
