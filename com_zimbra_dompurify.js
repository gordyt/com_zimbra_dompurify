/**
 * widget handler
 */



function com_zimbra_dompurify_handler () {
    console.log("dompurify: constructor");

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
        saveSend.apply(this, arguments);
    };
}

com_zimbra_dompurify_handler.prototype = new ZmZimletBase();
com_zimbra_dompurify_handler.prototype.constructor = com_zimbra_dompurify_handler;
