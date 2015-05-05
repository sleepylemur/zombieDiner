window.onclick = function(e) {
  console.log('clicked!');
  console.log('target ' + e.target);
  console.log('targethtml ' + e.target.innerHTML);
  console.log('src ' + e.target.src);
  // console.log('bubbles: '+e.bubbles);
  // e.target.click();
  console.log('['+e.screenX+","+ e.screenY+']');
}

$('#testbutton1').on('click', function(){alert('1 clicked');});
$('#testbutton').on('click', function(){alert('2 clicked');});
$('#testbutton2').on('click', function(){alert('3 clicked');});


var categorytemplate = _.template($('#categorytemplate').html());
var dishtemplate = _.template($('#dishtemplate').html());


var DishView = Backbone.View.extend({
  tagName: 'li',
  className: 'dish ui-state-default',
  events: { "click .editdishbutton": "handleedit",
            "click .revertdishbutton": "render",
            "click .updatedishbutton": "handleupdate",
            "click .deletedishbutton": "handledelete"},
  initialize: function() {
    Backbone.Validation.bind(this);
    // console.log("new dishview "+this.model.id);
    this.$el.data('id',this.model.id);
    this.listenTo(this.model, "change", this.render);
  },
  render: function() {
    this.$el.html(dishtemplate({dish: this.model.toJSON()}));
    return this;
  },
  handleupdate: function() {
    var image = this.$el.find('input.imagebox').val();
    var name = this.$el.find('input.namebox').val();
    var price = this.$el.find('input.pricebox').val();
    var err = this.model.preValidate({name:name, price:price});
    this.$el.find('.errmsg').remove();
    if (err) {
      if (err.name) {this.$el.find('input.namebox').after($('<p>').html(err.name).addClass('errmsg'));}
      if (err.price) {this.$el.find('input.pricebox').after($('<p>').html(err.price).addClass('errmsg'));}
    } else {
      this.model.set({image_url:image,
        name:name,
        price:price
      });
      this.model.save();
    }
  },
  handledelete: function() {
    this.model.destroy();
  },
  handleedit: function() {
    this.$el.find('div.displaydish').addClass('hidden');
    this.$el.find('div.editdish').removeClass('hidden');
  }
});

var DishesView = Backbone.View.extend({
  initialize: function() {
    // console.log("new dishesview");
    this.listenToOnce(this.collection, "sync", function() {
      this.render();
      this.listenTo(this.collection, "add remove", this.render);
    });

    // enable draggable sorting in this view
    $(function() {
      this.$el.sortable({
        update: this.handlesort.bind(this),
        connectWith: '.disheslist'
      });
      this.$el.disableSelection();
    }.bind(this));
  },
  render: function() {
    if (arguments.length<3 || !arguments[2]['norender']) { // make sure we didn't get passed a norender flag
      this.$el.html("");
      // console.log("dishesview render: "+this.collection.length);
      this.collection.each( function(model) {
        this.$el.append(new DishView({model: model}).render().$el);
      }.bind(this));
    }
    return this;
  },
  handlesort: function(event,ui) {
    if (ui.sender) {
      // if we received a dish from another category then move it to the appropriate collection
      var itemid = ui.item.data('id');
      var senderid = ui.sender.data('id');
      for (var catid=0; catid<this.rootcollection.models.length; catid++) {
        if (this.rootcollection.models[catid].id === senderid) {
          // found matching sender category
          var sendercat = this.rootcollection.models[catid];
          for (var dishid=0; dishid<sendercat.dishes.models.length; dishid++) {
            if (sendercat.dishes.models[dishid].id === itemid) {
              // found matching sender dish so now move it to our new category
              var dish = sendercat.dishes.models[dishid];
              sendercat.dishes.remove(dish);
              this.collection.add(dish, {'norender': true}); // pass in a norender flag so it doesn't render
              break;
            }
          }
          break;
        }
      }
    }

    // loop through dom elements to get order and set corresponding model position to match
    var $dishes = this.$el.find('.dish');
    var catid = this.$el.data('id');
    $dishes.each(function (dishid) {
      var id = $dishes.eq(dishid).data('id');
      for (var modelid = 0; modelid < this.collection.models.length; modelid++) {
        if (this.collection.models[modelid].id === id) {
          // console.log("dishid: "+dishid+" modelid: "+id+" modelnum: "+modelid);
          this.collection.models[modelid].set({position: dishid, category_id: catid});
          this.collection.models[modelid].save();
          break;
        }
      }
    }.bind(this));
  }
});

var CategoryView = Backbone.View.extend({
  tagName: 'li',
  className: 'ui-state-default',
  events: {"click .updatebutton": "handleupdate",
            "click .editbutton": "handleedit",
            "click .revertbutton": "render",
            "click .addbutton": "handleadd",
            "click .deletebutton": "handledelete"},
  initialize: function() {
    // console.log("new categoryview");
    this.$el.data('id',this.model.id);
    this.listenTo(this.model, "change:name", this.render);
  },
  render: function() {
    // console.log("categoryview render");
    this.$el.html("");
    this.$el.append(categorytemplate({name: this.model.get('name')}));
    console.log('catview'+this.model.id);
    this.$el.find('.editbutton').on('click',function() {console.log('random test of click');});
    
    this.dishesview = new DishesView({el: this.$el.find('.disheslist').get(0), collection: this.model.dishes });
    this.dishesview.$el.data('id',this.model.id);
    this.dishesview.rootcollection = this.rootcollection;
    this.dishesview.render();
    return this;
  },
  handleupdate: function() {
    var name = this.$el.find('input').val();
    var err = this.model.preValidate({name:name});
    this.$el.find('.errmsg').remove();
    if (err) {
      // validation failed so show errmsg
      if (err.name) {this.$el.find('input').after($('<p>').html(err.name).addClass('errmsg'));}
    } else {
      // validation passed
      this.$el.find('.displaycategory').removeClass('hidden');
      this.$el.find('.editcategory').addClass('hidden');
      this.model.set({name: name});
      this.model.save();
    }
  },
  handleadd: function() {
    this.model.dishes.create({image_url:"http://lorempixel.com/100/100", name:"new dish", price:"1.00", category_id: this.model.id});
  },
  handledelete: function() {
    this.model.destroy();
  },
  handleedit: function() {
    console.log('edit clicked');
    this.$el.find('.editcategory').removeClass('hidden');
    this.$el.find('.displaycategory').addClass('hidden');
  }
});

var CategoriesView = Backbone.View.extend({
  el: '#categories',
  events: {'click #newcategorybutton': "newcategory"},
  initialize: function() {
    this.$ul = this.$el.find('#categorieslist');
    this.collection = new Categories();
    this.collection.fetch();
    this.listenToOnce(this.collection, "sync", function() {
      // catch the first fetch update, to do a single render of page
      this.render();
      // after the first update, re-render whenever a category is added or removed
      this.listenTo(this.collection, "add remove", this.render);

      // enable draggable sorting of categories
    });


    // $(function() {
    //   this.$el.find('#categorieslist').sortable({handle: '.displaycategory', update: this.handlesort.bind(this)});
    //   this.$el.find('#categorieslist').disableSelection();
    // }.bind(this));
    // console.log("new categoriesview");
  },
  render: function() {
    // console.log("categoriesview render: "+this.collection.length);
    this.$ul.html("");
    this.collection.each( function(model) {
      var newview = new CategoryView({model: model});
      newview.rootcollection = this.collection;
      this.$ul.append(newview.render().$el);
    }.bind(this));
    return this;
  },
  newcategory: function() {
    this.collection.create({name: 'untitled'});
    // console.log('new');
  },
  handlesort: function() {
    // loop through dom elements to get order and set corresponding model position to match
    var $categories = this.$ul.find('> li');
    $categories.each(function (catid) {
      var id = $categories.eq(catid).data('id');
      for (var modelid = 0; modelid < this.collection.models.length; modelid++) {
        if (this.collection.models[modelid].id === id) {
          this.collection.models[modelid].set({position: catid});
          this.collection.models[modelid].save();
        }
      }
    }.bind(this));
  }
});

var categoriesView = new CategoriesView();

// categories.fetch();