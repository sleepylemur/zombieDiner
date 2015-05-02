var assert = require('assert');
var test = require('selenium-webdriver/testing');
var webdriver = require('selenium-webdriver');

test.describe('Google Search', function() {
  this.timeout(15000);
  var driver;

  test.before(function() {
    driver = new webdriver.Builder().
      withCapabilities(webdriver.Capabilities.chrome()).
      build();
  });

  test.after(function() {
    driver.quit();
  });

  test.it('Google search should have google logo', function() {
    driver.get("http://www.google.com");
    driver.findElement(webdriver.By.name("q")).sendKeys('pugs');
    driver.findElement(webdriver.By.tagName("form")).submit();

    driver.wait(function() {
      return driver.isElementPresent(webdriver.By.partialLinkText("pug"));
    }, 3000);
  });
});