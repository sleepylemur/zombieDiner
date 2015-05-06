var assert = require('assert');
var test = require('selenium-webdriver/testing');
var webdriver = require('selenium-webdriver');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var sqlite3 = require('sqlite3');
var expect = require('chai').expect;
var fs = require('fs');
var By = webdriver.By;

var db = new sqlite3.Database('db/test.db');
var stilltesting = false;
var testport = 3500;
var nodeserver;

var dbseed;

// driver methods
// setFileDetector,controlFlow,schedule,getSession,getCapabilities,quit,actions,touchActions,executeScript,executeAsyncScript,call,wait,sleep,getWindowHandle,getAllWindowHandles,getPageSource,close,get,getCurrentUrl,getTitle,findElement,findElementInternal_,findDomElement_,isElementPresent,findElements,findElementsInternal_,takeScreenshot,manage,navigate,switchTo

test.describe('zombiediner', function() {

  // ----------------   set up   ----------------

  test.before(function(done) {
    // read testseed.sql
    fs.readFile('db/testseed.sql', function(err,data) {
      if (err) throw(err);
      // run testseed.sql on our testing db
      db.exec(data.toString(), function(dberr) {
        if (dberr) throw(dberr);
        // start server.js
        nodeserver = spawn('node',['server.js',testport,'db/test.db']);
        //nodeserver = exec('node server.js '+testport+' db/test.db',execcallback);
        // setup our webdriver
        driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
        done();
      });
    });
  });

  // ----------------   tear down   ----------------

  test.after(function(done) {
    stilltesting = false;
    driver.quit();
    nodeserver.kill('SIGINT');
    done();
  });


  // ----------------   tests   ----------------

  test.it('Logo should appear', function() {
    driver.get('http://localhost:'+testport);
    return driver.isElementPresent(webdriver.By.css('img.logo'));
  });

  test.it('All 3 category names should appear in order', function(done) {
    driver.get('http://localhost:'+testport);
    driver.getPageSource().then(function(src) {
      expect(src.indexOf('cat1')).to.not.equal(-1);
      expect(src.indexOf('cat2')).to.not.equal(-1);
      expect(src.indexOf('cat3')).to.not.equal(-1);
      expect(src.indexOf('cat1')).to.be.below(src.indexOf('cat2'));
      expect(src.indexOf('cat2')).to.be.below(src.indexOf('cat3'));
      done();
    });
  });

  test.it('All 6 dishes should appear in order', function(done) {
    driver.get('http://localhost:'+testport);
    driver.getPageSource().then(function(src) {
      for (var i=1;i<7;i++) {
        expect(src.indexOf('dish'+i)).to.not.equal(-1);
      }
      for (var i=1;i<6;i++) {
        expect(src.indexOf('dish'+i)).to.be.below(src.indexOf('dish'+(i+1)));
      }
      done();
    });
  });
});

test.describe('zombiediner mod', function() {
  this.timeout(15000);
  test.before(function(done) {
    fs.readFile('db/testseed.sql', function(err,data) {
      if (err) throw(err);
      dbseed = data.toString();
      // run testseed.sql on our testing db
      db.exec(dbseed, function(dberr) {
        if (dberr) throw(dberr);
        // start server.js
        nodeserver = spawn('node',['server.js',testport,'db/test.db']);
        //nodeserver = exec('node server.js '+testport+' db/test.db',execcallback);
        // setup our webdriver
        var prefs = new webdriver.logging.Preferences();
        prefs.setLevel(webdriver.logging.Type.BROWSER, webdriver.logging.Level.DEBUG);

        var caps = webdriver.Capabilities.chrome();
        caps.setLoggingPrefs(prefs);
        driver = new webdriver.Builder().withCapabilities(caps).build();
        done();
      });
    });
  });

  test.after(function(done) {
    stilltesting = false;
    driver.quit();
    nodeserver.kill('SIGINT');
    done();
  });

  test.beforeEach(function(done) {
    db.exec(dbseed, function(dberr) {
      if (dberr) throw(dberr);
      driver.get('http://localhost:'+testport).
      then(done);
    });
  });

  test.afterEach(function(done) {
    driver.manage().logs().get(webdriver.logging.Type.BROWSER)
      .then(function(entries) {
        entries.forEach(function(entry) {
          console.log('[%s] %s', entry.level.name, entry.message);
        });
        done();
      });
  });

  test.it('"new category" should create category at end of DOM and in db', function(done) {
    driver.findElement(By.id('newcategorybutton')).click().then( function(a) {
      driver.findElements(By.css('ul#categorieslist > li')).then( function(arr) {
        expect(arr).to.have.length(4);
        arr[3].findElement(By.tagName('h2')).getText().then( function(title) {
          expect(title).to.contain('untitled');
        }).then( function() {
          db.get("SELECT name,max(position) FROM categories", function(err,data) {
            if(err) throw(err);
            expect(data.name).to.equal("untitled");
            done();
          });
        });;
      });
    });
  });

  test.it('"edit category" should hide displaycategory and show editcategory', function(done) {
    // var li = driver.findElement(By.css('ul#categorieslist > li:nth-child(1)'));
    var li = getRandomCat(driver);
    var displaydiv = li.findElement(By.css('div.displaycategory'));
    var editdiv = li.findElement(By.css('div.editcategory'));

    // before click we expect display to be shown and edit to be hidden
    editdiv.isDisplayed().then(function(bool) {
      expect(bool).to.be.false;
    });
    displaydiv.isDisplayed().then(function(bool) {
      expect(bool).to.be.true;
    }).then( function() {
      var editbutton = displaydiv.findElement(By.css('img.editbutton'));
      editbutton.click();
      displaydiv.isDisplayed().then(function(bool) {
        expect(bool).to.be.false;
      });
      editdiv.isDisplayed().then(function(bool) {
        expect(bool).to.be.true;
      });
    });
    done();
  });

  test.it('"update category" should change value in DOM and db', function(done) {
    var li = getRandomCat(driver);
    var displaydiv = li.findElement(By.css('div.displaycategory'));
    var editdiv = li.findElement(By.css('div.editcategory'));
    displaydiv.findElement(By.css('img.editbutton')).click();
    editdiv.findElement(By.tagName('input')).sendKeys("newtitle");
    editdiv.findElement(By.className('updatebutton')).click();
    li.findElement(By.css('div.displaycategory'))
      .findElement(By.tagName('h2')).getText().then(function(txt) {
      expect(txt).to.contain('newtitle');
    }).then(function() {
      db.get("SELECT name FROM categories WHERE name LIKE '%newtitle%'", function(err,data) {
        if (err) throw(err);
        expect(data).to.not.be.undefined;
        done();
      });
    });
  });

  test.it('"update category" should not accept empty name', function(done) {
    var li = getRandomCat(driver);
    var displaydiv = li.findElement(By.css('div.displaycategory'));
    var editdiv = li.findElement(By.css('div.editcategory'));
    displaydiv.findElement(By.css('img.editbutton')).click();
    editdiv.findElement(By.tagName('input')).sendKeys("\b\b\b\b");
    editdiv.findElement(By.className('updatebutton')).click();
    editdiv.isDisplayed().then(function(bool) {
      expect(bool).to.be.true;
    });
    editdiv.getText().then(function(txt) {
      expect(txt).to.contain('is required');
    }).then(done);
  });

  test.it('"delete category" should remove category from DOM and db', function(done) {
    var catid = Math.floor(Math.random()*3+1);
    var li = driver.findElement(By.css('ul#categorieslist > li:nth-child('+catid+')'));
    var catname = 'cat'+catid;
    var displaydiv = li.findElement(By.css('div.displaycategory'));
    var editdiv = li.findElement(By.css('div.editcategory'));
    displaydiv.findElement(By.css('img.editbutton')).click();
    editdiv.findElement(By.css('.deletebutton')).click();
    driver.getPageSource().then(function(txt) {
      expect(txt).to.not.contain(catname);
    }).then(function() {
      db.get("SELECT name FROM categories WHERE name = ?", catname, function(err,data) {
        if (err) throw(err);
        expect(data).to.be.undefined;
        done();
      });
    });
  });

  test.it('"revert category" should hide edit form without changing title', function(done) {
    var li = getRandomCat(driver);
    var displaydiv = li.findElement(By.css('div.displaycategory'));
    var editdiv = li.findElement(By.css('div.editcategory'));
    displaydiv.findElement(By.css('img.editbutton')).click();
    editdiv.findElement(By.tagName('input')).sendKeys("newtitle");
    editdiv.findElement(By.className('revertbutton')).click();
    li.findElement(By.css('div.editcategory')).isDisplayed().then(function(bool) {
      expect(bool).to.be.false;
    }).then(function() {
      li.findElement(By.css('div.displaycategory')).getText().then(function(txt) {
        expect(txt).to.not.contain('newtitle');
        done();
      });
    });
  });

  test.it('"new dish" should add dish to the top of the category in the DOM and the db', function(done) {
    var li = getRandomCat(driver);
    var displaydiv = li.findElement(By.css('div.displaycategory'));
    var catname;
    displaydiv.findElement(By.tagName('h2')).getText().then(function(txt) {catname = txt;});
    displaydiv.findElement(By.css('img.addbutton')).click();
    li.findElement(By.css('.disheslist > li:nth-child(1) p:nth-child(1)')).getText().then(function(txt) {
      expect(txt).to.equal('new dish');
      db.get("SELECT name,min(position) FROM dishes WHERE category_id = ?", catname, function(err,data) {
        expect(data).to.not.be.undefined;
        done();
      });
    });
  });

  test.it('"edit dish" should hide displaydish and show editdish', function(done) {
    var li = getRandomCat(driver);
    getRandomDish(li,function(lidish) {
      lidish.findElement(By.className('editdishbutton')).click();
      lidish.findElement(By.className('displaydish')).isDisplayed().then(function(bool) {
        expect(bool).to.be.false;
      });
      lidish.findElement(By.className('editdish')).isDisplayed().then(function(bool) {
        expect(bool).to.be.true;
      });
      done();
    });
  });
  // drag and drop test that moves an item, but it fails to trigger jQuery UI completely.
  // test.it('"drag dish" should move dish1 from position 1 to position 3 in DOM and db', function(done) {
  //   driver.findElements(By.className('displaydish')).then(function(arr) {
  //     // arr[0].getInnerHtml().then(console.log);
  //     // console.log('2');
  //     // arr[2].getInnerHtml().then(console.log);
  //     new webdriver.ActionSequence(driver)
  //       .mouseMove(arr[0])
  //       .mouseDown()
  //       .mouseMove(arr[1])
  //       .perform();
  //     setTimeout(function() {
  //       new webdriver.ActionSequence(driver)
  //         .mouseMove(arr[0])
  //         .mouseMove(arr[2])
  //         .mouseUp()
  //         .perform();
  //     }, 100);
  //     // e.getInnerHtml().then(console.log);
  //     // mybutton.getText().then(console.log);
  //     // console.log('yay!');
  //     setTimeout(done,15000);
      
  //   });
  // });

});

function getRandomCat(driver) {
  return driver.findElement(By.css('ul#categorieslist > li:nth-child('+Math.floor(Math.random()*3+1)+')'));
}

function getRandomDish(li,next) {
  li.findElements(By.css('ul.disheslist > li.dish')).then(function(arr) {
    next(arr[Math.floor(Math.random()*arr.length)]);
  });
}

/*
  test buttons
    category
      new category
      edit
      update
        test validation
      delete
      revert

    dishes
      new
      edit
      update
        test validation
      delete
      revert

  drag and drop tests seem to be impossible at the moment
  test drag and drop
    dishes
    categories
*/
function execcallback(error, stdout, stderr) {
  // if (stilltesting) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  // }
}