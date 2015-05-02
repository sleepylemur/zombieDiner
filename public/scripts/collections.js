

var Categories = Backbone.Collection.extend({
  model: Category,
  url: "categories",
  initialize:function() {
    console.log('new categories');
  }
});