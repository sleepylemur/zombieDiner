var Dish = Backbone.Model.extend({
  initialize:function() {
    console.log('dish created');
  }
});

var Dishes = Backbone.Collection.extend({
  model: Dish,
  initialize:function() {
    console.log('new dishes');
  }
});

var Category = Backbone.Model.extend({
  initialize:function() {
    this.dishes = new Dishes();
    this.dishes.url = "categories/"+this.id+"/dishes";
    console.log(this.dishes);
    this.dishes.fetch();
    console.log('category created');
  }
});