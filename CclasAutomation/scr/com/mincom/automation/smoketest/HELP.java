package com.mincom.automation.smoketest;

import com.mincom.ria.automated.AbstractMFUITest;

public class HELP extends AbstractMFUITest {
	
	public void testHelp() {
		//jUnitVersion();
		
		mfui.loadApp("help");			
		waitAppReady();			
		//println("help: " + widget.getValue("release"));
		//String expected22="3.4.0.2_ga_85";		
		//assertEquals(widget.getValue("version"), expected22);		
		
	}

}
