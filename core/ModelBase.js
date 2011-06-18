define([
    "dojo",
    "sumo"
], function(dojo, sumo) {
    var ModelBase = dojo.declare(null, {
        // reimplementation of dijit.tree.model

        getRoot: function(onItem, onError) {
            onItem(this.root());
        },
        
        mayHaveChildren: function(item) {
            var children = item.children;
            return children ? children.length != 0 : false;
        },
        
        getChildren: function(parentItem, callback, onError) {
            callback(parentItem.children);
        },
        
        getLabel: function(item) {
            return item.name;
        },
                
        isItem: function(something) {
            return something.id;
        },
        
        getIdentity: function(item) {
            return item.id;
        },
        
		onChildrenChange: function(parent, newChildrenList) {
		},
		
		notifyChildrenChanged: function(parent) {
		    this.getChildren(parent, dojo.hitch(this, function(children){
			    this.onChildrenChange(parent, children);
			}));
		}
    });
    
    var ListModel = dojo.declare(ModelBase, {
        constructor: function() {
            this._root = {
                children: []
            };
        },
        
        root: function() {
            return this._root;
        },
        
        setData: function(data) {
            var children = [];
            _.each(data, function(name) {
                var item = {
                    name: name
                };
                sumo.makeUnique(item, "lw_");
                children.push(item);
            });
            this.root().children = children;
            this.notifyChildrenChanged(this.root());
        }
    });
    
    return {
        ModelBase: ModelBase,
        ListModel: ListModel
    }
})
