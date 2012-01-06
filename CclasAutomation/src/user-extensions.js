
/**
 * The following is the ID for the Flex object on the html page.
 * Should be different depending on the application under test.
 */
var flashObjectLocator = 'ui';

Selenium.prototype.getEverything = function(method, args) {
	return callMFUIMethod(method, args);
};

Selenium.prototype.doEverything = function(method, args) {
	callDoMFUIMethod(method, args)
};

/**
  * The next two functions are used to manipulate the locale in which a test takes place and are Browser Specific!! 
  * 
  * See here http://code.google.com/p/selenium/wiki/TipsAndTricks for how to do this with WebDriver and FireFox
  * Each browser needs to be dealt with this on a case by case basis :-(
  * 
  */
Selenium.prototype.doSetAcceptLanguage = function(lang) {
        if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){ //test for Firefox/x.x or Firefox x.x (ignoring remaining digits);
	    var ffversion=new Number(RegExp.$1) // capture x.x portion and store as a number
	    if (ffversion>=3) {
		/**
		 * The solution for Firefox 3 (non-WebDriver) comes from
		 * http://stackoverflow.com/questions/4710299/how-to-change-language-settings-of-firefox-using-javascript
		 */
		var rootPrefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch);
		rootPrefs.setCharPref("intl.accept_languages", lang);
	    }
	}
};

Selenium.prototype.getAcceptLanguage = function() {
        if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){ //test for Firefox/x.x or Firefox x.x (ignoring remaining digits);
	    var ffversion=new Number(RegExp.$1) // capture x.x portion and store as a number
	    if (ffversion>=3) {
		/**
		 * The solution for Firefox 3 (non-WebDriver) comes from
		 * http://stackoverflow.com/questions/4710299/how-to-change-language-settings-of-firefox-using-javascript
		 */
		var rootPrefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch);
		return rootPrefs.getCharPref("intl.accept_languages");
	    }
	}
};


var extra = {}


function callDoMFUIMethod(method, args) {
	var retval = callMFUIMethod(method, args);
	if(retval != 'true') throw new SeleniumError(retval);
}



function callMFUIMethod (method, args) {
	method = extra[method] || method
	
    // the object that contains the exposed Flex functions
    var funcObj = null; 
    // get the flash object
    var flashObj = selenium.browserbot.findElement(this.flashObjectLocator);
    
    if (flashObj.wrappedJSObject) {
            flashObj = flashObj.wrappedJSObject;
    }
    
    if (typeof(flashObj[method]) == 'unknown' && args == '')
    {
            return flashObj[method]();
    }
    
    // find object holding functions
    if(typeof(flashObj[method]) == 'object' || typeof(flashObj[method]) == 'unknown')
            // for IE (will be the flash object itself)
            funcObj = flashObj;
    else {
            // Firefox (add temp button and work with it)
            var input;
            if (selenium.browserbot.getCurrentWindow().document.getElementById('selenium_bridge') == null)
            {
                    input = selenium.browserbot.getCurrentWindow().document.createElement('input');
                    input.setAttribute('id', 'selenium_bridge');
                    input.setAttribute('value', 'test');
                    selenium.browserbot.getCurrentWindow().document.body.appendChild(input); 
            }
            else
            {
                    input = selenium.browserbot.getCurrentWindow().document.getElementById('selenium_bridge')
            }
            if (args == undefined) {
            	args = "";
            }
            
            input.setAttribute('onClick', 'document.getElementById("selenium_bridge").value = document.getElementById(\'' + this.flashObjectLocator + 
                    '\')[\'' + method + '\'](\'' + args + '\')'); 
            var e =  selenium.browserbot.getCurrentWindow().document.createEvent('HTMLEvents');
            e.initEvent('click', false, false);
            input.dispatchEvent(e);

            return input.value;
    } 
    
    // throw a error to Selenium if the exposed function could not be found
    if(funcObj == null)
            throw new SeleniumError('Function ' + method + ' not found on the External Interface for the flash object ' + this.flashObjectLocator);

    return funcObj[method](id, args);
}

