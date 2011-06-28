define([
    "dojo"
], function(dojo) {
    return {
        makeUnique: function(obj, prefix) {
            obj.id = _.uniqueId(prefix);
        },
        
        setVisible: function(elem, visible) {
            dojo.style(elem, { display: (visible ? "block" : "none")});
        },
        
        Horizontal: 1,
        Vertical: 2,
        
        opposite: function(ori) {
            return (ori === this.Horizontal) ? this.Vertical : this.Horizontal;
        }
    };
});
