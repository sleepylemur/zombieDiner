var assert = require('assert');
var test = require('selenium-webdriver/testing');
var webdriver = require('selenium-webdriver');
var exec = require('child_process').exec;
var nodeserver;

var stilltesting = true;

test.describe('servertest', function() {
  // set up testing environment
  test.before(function() {
    // start server.js
    nodeserver = exec('node server.js',execcallback);
    // setup our webdriver
    driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
  });

  //tear down testing environment
  test.after(function() {
    stilltesting = false;
    nodeserver.kill();
    driver.quit();
  });

  test.it('Logo should appear', function() {
    driver.get('http://localhost:3001');
    return driver.isElementPresent(webdriver.By.css('img.logo'));
  });
});

function execcallback(error, stdout, stderr) {
  if (stilltesting) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  }
}

// test.describe('Google Search', function() {
//   this.timeout(15000);
//   var driver;

//   test.before(function() {
//     driver = new webdriver.Builder().
//       withCapabilities(webdriver.Capabilities.chrome()).
//       build();
//   });

//   test.after(function() {
//     driver.quit();
//   });

//   test.it('Google search should have google logo', function() {
//     driver.get("http://www.google.com");
//     driver.findElement(webdriver.By.name("q")).sendKeys('pugs');
//     driver.findElement(webdriver.By.tagName("form")).submit();

//     driver.wait(function() {
//       return driver.isElementPresent(webdriver.By.partialLinkText("pug"));
//     }, 3000);
//   });
// });