define([
    "dojo"
], function(dojo) {
    return {
        makeUnique: function(obj, prefix) {
            obj.id = _.uniqueId(prefix);
        },
        
        setVisible: function(elem, visible) {
            dojo.style(elem, { display: (visible ? "block" : "none")});
        }
    };
});
