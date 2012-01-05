package com.mincom.ria.automated;

import java.util.Calendar;

import junit.framework.TestCase;

import org.jdom.Element;

import com.mincom.ellipse.rc.api.ApplicationAPI;
import com.mincom.ellipse.rc.api.CalendarAPI;
import com.mincom.ellipse.rc.api.CustomisationAPI;
import com.mincom.ellipse.rc.api.GISMapAPI;
import com.mincom.ellipse.rc.api.GridAPI;
import com.mincom.ellipse.rc.api.HomeAPI;
import com.mincom.ellipse.rc.api.MFUI;
import com.mincom.ellipse.rc.api.TreeAPI;
import com.mincom.ellipse.rc.api.WidgetAPI;
import com.mincom.ellipse.rc.api.runner.AntRunner;
import com.mincom.ellipse.rc.api.runner.Runner;
import com.mincom.ellipse.rc.apiv2.Grid;
import com.mincom.ellipse.rc.apiv2.MFUIV2;
import com.mincom.ellipse.rc.apiv2.Widget;

public abstract class AbstractMFUITest extends TestCase
{	
	protected static final int MSE100_RESULT = 2;

	protected MFUI mfui;
	protected MFUIV2 mfuiv2;
	protected ApplicationAPI app;
	
	protected GridAPI grid;	
	
	protected GISMapAPI gisMap;
	protected CalendarAPI cal;
	protected WidgetAPI widget;
	
	protected Widget widgetV2;
	protected TreeAPI tree;
	
	protected HomeAPI home;
	protected CustomisationAPI custom;
	protected AntRunner runner;
	public static  String  workSpace;
	
	
	// Capture a screenshot of an error and save it to the Workspace directory
	@Override
	public void runTest() throws Throwable {
		workSpace = runner.getProperty("test.workspace");
        try {
        	super.runTest();
        } catch(Throwable e) {
        	
        	// If the workspace variable is not defined in Jenkins, save 
        	// the image to the base Automation code directory (i.e. riaImpl/RemoteControlAPI/)
        	// To setup in Jenkins, in your job create a variable parameter called:
        	// test.workspace with the value of the directory you'd like the files saved to.
        	if (workSpace == null) {
        		workSpace = "";
        	}
        	
        	String methodName = getName() ;
        	mfui.captureScreenshot(workSpace + methodName + Math.random()+ "-Error.png" );
            throw e;
        } 
	}
	
	public void setRunner(AntRunner runner) {
		this.runner = runner;
	}

	protected void onTearDown() throws Exception {
		runner.tearDown();
	}

	protected void setUp() throws Exception {
		onSetUp();
	}

	protected void tearDown() throws Exception {
		onTearDown();
	}
	
	public void onSetUp() throws Exception {
		  runner = getRunner();  
		  runner.setUp();
		  
		  
		  mfui = runner.getMFUI();
		  mfuiv2=runner.getMFUIV2();	  
		  
		  grid = mfui.getGrid();
		  gisMap = mfui.getGISMap();
		  cal = mfui.getCalendar();
		  app = mfui.getApplication();
		  widget = mfui.getWidget();
		  
		  tree = mfui.getTree();
		  home = mfui.getHome();
		  custom = mfui.getCustom();
		 }
	
	protected void checkFirstMessage(String type) {
		assertEquals("CORE.E06004: Action successfully completed.", app.getErrors()
				.getChild("message").getChildText("text").trim());
	}

	protected String jn(String grid, String col) {
		return grid + ":" + col;
	}
	
	protected void assertDatesEqual(Calendar cal1, Calendar cal2) {
		if (cal1==null && cal2==null) return;
		else if (cal1==null || cal2==null || cal.compareDates(cal1, cal2)!=0)
			fail(format(cal1, cal2));
	}
	
	protected void assertTimesEqual(Calendar cal1, Calendar cal2) {
		if (cal1==null && cal2==null) return;
		else if (cal1==null || cal2==null || cal.compareTimes(cal1, cal2)!=0)
			fail(format(cal1, cal2));
	}
	
	protected void assertDatetimesEqual(Calendar cal1, Calendar cal2) {
		if (cal1==null && cal2==null) return;
		else if (cal1==null || cal2==null || cal.compareDatetimes(cal1, cal2)!=0)
			fail(format(cal1, cal2));
	}
	
	private String format(Object expected, Object actual) {
		return "expected:<" + expected + "> but was:<" + actual + ">";
	}
	
	protected AntRunner getRunner() {
		return new AntRunner();
	}
	
	protected String getErrorMsg(){
		String errstr = "";
		Element el  = app.getErrors();
		if (el.getChild("message") != null
				|| el.getChild("errors") != null) {

			if (el.getChild("message").getChild("stacktrace")!=null){
				errstr =  el.getChild("message").getChildText(
				"stacktrace");
			}
			else if (el.getChild("message").getChild("text")!=null){
				errstr = el.getChild("message").getChildText(
				"text");
				if (errstr !=null){
					//Integer.parseInt(el.getChild("message").getChildText("severity").trim())>2
					if ( el.getChild("message").getChild("severity")==null) {
						errstr = null;
					}
				}
			}
			else {
				errstr = el.getChild("errors").getChildText(
				"text");
			}
			
			if (errstr != null) {
				System.out.println( errstr);
			} else {
				errstr = "";
			}
		}
		return errstr.trim();
	}
	
	protected String getMessage(){
		String message = "";
		Element el  = app.getErrors();
		if (el.getChild("message") != null
				|| el.getChild("errors") != null) {
			message = el.getChild("message").getChildText(
					"text");
			if (message == null){
				el.getChild("errors").getChildText(
				"text");
			}
			if (message != null) {
				System.out.println( message);
			} else {
				message = "";
			}
		}
		return message.trim();
	}
	
	protected void sleep(double second) {
		int i = (int)(second * 1000);
		try {
			Thread.sleep(i);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	protected void waitAppReady() {
		app.waitForReady();
		sleep(2);
	}
	
	protected void searchAndWaitForResults(int gridRow){
		app.toolbarAction("Search");
		waitAppReady();

		if (!app.getStateName().contains("detail")){
			if (grid.isVisible("results"))
			{
			grid.doubleClick("results", gridRow);
			waitAppReady();
			}
		}
	}
	
	protected void searchAndWaitForResults(){
		app.toolbarAction("Search");
		waitAppReady();
	}
	
	/**
	 * check whether actual text contains the expected text
	 */
	protected void assertContains(String expectedMsg, String actualMsg ) {
		expectedMsg = expectedMsg.toLowerCase();
		actualMsg = actualMsg.toLowerCase();
		assertEquals("expected: " + expectedMsg +" but was:" + actualMsg,true, actualMsg.contains(expectedMsg));
	}
	protected void println(String msg){
		System.out.println(msg);
	}

}
