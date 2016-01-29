/**
 * widget handler
 */

function com_zimbra_dompurify_handler () {
    console.log("dompurify: constructor");
    $.ajaxSetup({
        dataFilter: function (data, type) {
            console.log("dompurify.dataFilter: type='" + type + "', data.length='" +
                data.length + "'");
            return data;
        }
    });
}

com_zimbra_dompurify_handler.prototype = new ZmZimletBase();
com_zimbra_dompurify_handler.prototype.constructor = com_zimbra_dompurify_handler;
