/**
 * widget handler
 */

function com_zimbra_dompurify_handler () {
    console.log("dompurify: constructor");
    var saveSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        console.log("dompurify.send: arguments.length='" + arguments.length + "'");
        saveSend.apply(this, arguments);
    };
}

com_zimbra_dompurify_handler.prototype = new ZmZimletBase();
com_zimbra_dompurify_handler.prototype.constructor = com_zimbra_dompurify_handler;
