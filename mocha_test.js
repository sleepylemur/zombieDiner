var assert = require('assert');
var test = require('selenium-webdriver/testing');
var webdriver = require('selenium-webdriver');
var exec = require('child_process').exec;
var sqlite3 = require('sqlite3');
var expect = require('chai').expect;
var fs = require('fs');
var By = webdriver.By;

var db = new sqlite3.Database('db/test.db');
var nodeserver;
var stilltesting = false;
var testport = 3500;

var dbseed;

// driver methods
// setFileDetector,controlFlow,schedule,getSession,getCapabilities,quit,actions,touchActions,executeScript,executeAsyncScript,call,wait,sleep,getWindowHandle,getAllWindowHandles,getPageSource,close,get,getCurrentUrl,getTitle,findElement,findElementInternal_,findDomElement_,isElementPresent,findElements,findElementsInternal_,takeScreenshot,manage,navigate,switchTo

test.describe('zombiediner non-modifying test', function() {

  // ----------------   set up   ----------------

  test.before(function(done) {
    // read testseed.sql
    fs.readFile('db/testseed.sql', function(err,data) {
      if (err) throw(err);
      // run testseed.sql on our testing db
      db.exec(data.toString(), function(dberr) {
        if (dberr) throw(dberr);
        // start server.js
        nodeserver = exec('node server.js '+testport+' db/test.db',execcallback);
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
    nodeserver.kill();
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

test.describe('zombiediner modifying tests', function() {
  this.timeout(15000);
  test.before(function(done) {
    fs.readFile('db/testseed.sql', function(err,data) {
      if (err) throw(err);
      dbseed = data.toString();
      // run testseed.sql on our testing db
      db.exec(dbseed, function(dberr) {
        if (dberr) throw(dberr);
        // start server.js
        nodeserver = exec('node server.js '+testport+' db/test.db',execcallback);
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
    nodeserver.kill();
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

  test.it('"new category" should create category at top of DOM and in db', function(done) {
    driver.findElement(By.id('newcategorybutton')).click().then( function(a) {
      driver.findElements(By.css('ul#categorieslist > li')).then( function(arr) {
        expect(arr).to.have.length(4);
        arr[0].findElement(By.tagName('h2')).getText().then( function(title) {
          expect(title).to.contain('untitled');
        }).then( function() {
          db.get("SELECT name,min(position) FROM categories", function(err,data) {
            if(err) throw(err);
            expect(data.name).to.equal("untitled");
            done();
          });
        });;
      });
    });
  });

  test.it('"edit category" should hide displaycategory and show editcategory', function(done) {
    var li = driver.findElement(By.css('ul#categorieslist > li:nth-child(1)'));
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
      // editbutton.getLocation().then(function(loc) {
      //   var newloc = {x:Math.floor(loc.x)+10, y:Math.floor(loc.y)+10};
      //   console.log(newloc);
      //   new webdriver.ActionSequence(driver).
      //   mouseMove(newloc).
      //   click().
      //   perform().
      //   then( function() {
      //     driver.wait(webdriver.until.elementIsVisible(driver.findElement(By.css('ul#categorieslist > li:nth-child(1) div.editcategory'))),5000).then(done);
      //   });
      //   done();
      // });
      // displaydiv.findElement(By.css('img.addbutton')).click().then( function() {
      //   //after click we expect edit to be shown and display to be hidden
      //   driver.wait(webdriver.until.elementIsVisible(driver.findElement(By.css('ul#categorieslist > li:nth-child(1) div.editcategory'))),5000).then(done);
      // });
    });

    done();
  });

});


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

  test drag and drop
    dishes
    categories
*/
function execcallback(error, stdout, stderr) {
  if (stilltesting) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  }
}