var categorytemplate = _.template($('#categorytemplate').html());
var dishtemplate = _.template($('#dishtemplate').html());

var DishView = Backbone.View.extend({
  tagName: 'div',
  events: { "click .editdishbutton": "handleedit",
            "click .revertdishbutton": "render",
            "click .updatedishbutton": "handleupdate",
            "click .deletedishbutton": "handledelete"},
  initialize: function() {
    console.log("new dishview "+this.model.id);
    this.listenTo(this.model, "change", this.render);
  },
  render: function() {
    this.$el.html(dishtemplate({dish: this.model.toJSON()}));
    return this;
  },
  handleupdate: function() {
    this.model.set({image_url:this.$el.find('input.imagebox').val(),
      name:this.$el.find('input.namebox').val(),
      price:this.$el.find('input.pricebox').val()
    });
    this.model.save();
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
    console.log("new dishesview");
    this.listenToOnce(this.collection, "sync", function() {
      // this.$li = this.$el.append($('<li>').addClass('row'));
      this.render();
      this.listenTo(this.collection, "add remove", this.render);
    });
  },
  render: function() {
    this.$el.html("");
    console.log("dishesview render: "+this.collection.length);
    var i = 0;
    var $li;
    this.collection.each( function(model) {
      if (i++ % 2 === 0) {
        $li = $('<li>').addClass('row');
        this.$el.append($li);
      }
      $li.append(new DishView({model: model, className: "six columns"}).render().$el);
    }.bind(this));
    return this;
  }
});

var CategoryView = Backbone.View.extend({
  tagName: 'li',
  events: {"click .updatebutton": "handleupdate",
            "click .editbutton": "handleedit",
            "click .revertbutton": "render",
            "click .addbutton": "handleadd",
            "click .deletebutton": "handledelete"},
  initialize: function() {
    console.log("new categoryview");
    this.listenTo(this.model, "change:name", this.render);
  },
  render: function() {
    console.log("categoryview render");
    this.$el.html("");
    this.$el.append(categorytemplate({name: this.model.get('name')}));
    
    this.dishesview = new DishesView({el: this.$el.find('.disheslist').get(0), collection: this.model.dishes });
    this.dishesview.render();
    return this;
  },
  handleupdate: function() {
    this.$el.find('.displaycategory').removeClass('hidden');
    this.$el.find('.editcategory').addClass('hidden');
    this.model.set({name: this.$el.find('input').val()});
    this.model.save();
  },
  handleadd: function() {
    this.model.dishes.create({image_url:"http://lorempixel.com/100/100", name:"new dish", price:"1.00", category_id: this.model.id});
  },
  handledelete: function() {
    this.model.destroy();
  },
  handleedit: function() {
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
    });
    console.log("new categoriesview");
  },
  render: function() {
    console.log("categoriesview render: "+this.collection.length);
    this.$ul.html("");
    this.collection.each( function(model) {
      this.$ul.append(new CategoryView({model: model}).render().$el);
    }.bind(this));
    return this;
  },
  newcategory: function() {
    this.collection.create({name: 'untitled'});
    console.log('new');
  }
});

var categoriesView = new CategoriesView();

// categories.fetch();