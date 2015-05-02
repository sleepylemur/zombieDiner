var categorytemplate = _.template($('#categorytemplate').html());

var CategoryView = Backbone.View.extend({
  tagName: 'li',
  events: {"click .updatebutton": "handleupdate"},
  initialize: function() {
    console.log("new categoryview");
    this.listenTo(this.model, "change:name", this.render);
  },
  render: function() {
    console.log("categoryview render");
    this.$el.html("");
    this.$el.append(categorytemplate({name: this.model.get('name')}));
    return this;
  },
  handleupdate: function() {
    console.log('update!');
    this.model.set({name: this.$el.find('input').val()});
    this.model.save();
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
    console.log("categoriesview render");
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