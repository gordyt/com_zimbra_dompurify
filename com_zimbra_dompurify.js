/**
 * com_zimbra_dompurify Zimlet
 */


function com_zimbra_dompurify_handler () {
    /**
     * Return the first element named elem starting with root.
     * This is a recursive function.
     * Returns: undefined if cannot locate.
     */
    var findElement = function (root, elem) {
        var val = undefined;
        Object.keys(root).some(function (k) {
            if (k === elem) {
               val = root[k];
               return true;
            }
            else if (typeof root[k] === "object") {
                val = findElement(root[k], elem);
                return val !== undefined;
            }
            return false;
        });
        return val;
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
                messageParts = sanitizeMessageParts(messageParts);
            }
        }
        return j;
    };

    var saveRun = AjxCallback.prototype.run;
    AjxCallback.prototype.run = function (args) {
        if (args && args.text) {
            try {
                var v = JSON.parse(args.text);
                if (v.Body) {
                    v.Body = sanitizeTextHtml(v.Body);
                    args.text = JSON.stringify(v);
                }
            }
            catch (err) {
                console.log(err);
            }
        }
        saveRun.call(this, args);
    };

    var saveGetAttachmentLink = ZmMailMsgView.getAttachmentLinkHtml;
    ZmMailMsgView.getAttachmentLinkHtml = function (params) {
        var html = saveGetAttachmentLink.call(this, params);
        if (params.blankTarget) {
            $(document).on('click', "#" + params.id, {}, function (evt) {
                alert("clicked on " + params.id);
                return false;
            });
        }
        return html;
    };
}

com_zimbra_dompurify_handler.prototype = new ZmZimletBase();
com_zimbra_dompurify_handler.prototype.constructor = com_zimbra_dompurify_handler;
