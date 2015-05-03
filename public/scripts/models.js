var Dish = Backbone.Model.extend({
  validation: {
    price: {min: 1},
    name: {required: true}
  },
  initialize:function() {
    console.log('dish created '+this.id);
    this.url = function() {
      return this.id ? 'dishes/'+this.id : 'dishes';
    }
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
    this.dishes.fetch();
    console.log('category created');
  }
});

var Categories = Backbone.Collection.extend({
  model: Category,
  url: "categories",
  initialize:function() {
    console.log('new categories');
  }
});