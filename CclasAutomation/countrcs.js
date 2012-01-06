/****************************************************************
*                 countrcs.js                                   *
*                                                               *
* Parse the HTML in the Ant property 'grid.data.string' and     *
* count the number of RCs in the Grid represented. The data is  *
* assumed to be the result of 'get' ${selenium.hub.URL}/console *
*                                                               *
* Given the data is HTML the solution isn't based on semantics. *
* semantics. Instead it is totally tied to the structure of the *
* HTML. Although there is some attempt at sanity checking.      *
*                                                               *
* The HTML parser is based on the the code here:                *
*    http://ejohn.org/files/htmlparser.js                       *
* There are some minor bug fixes to the original                *
*                                                               *
****************************************************************/


importPackage(java.lang, java.util, java.io);

function main () {
    var project = self.getProject();
    var gridDataString = project.getProperty("grid.data.string");

    var numGridRCs= CountRCs(gridDataString);

    project.setProperty("num.grid.rcs", numGridRCs);
}
    
function makeMap(str){
    var obj = {}, items = str.split(",");
    for ( var i = 0; i < items.length; i++ )
	obj[ items[i] ] = true;
    return obj;
}

// Regular Expressions for parsing tags and attributes
// original regex: can't cope with e.g. <meta http-equiv="refresh" content="30"/>
//var startTag = /^<([-A-Za-z0-9_]+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/;
var startTag = /^<([-A-Za-z0-9_]+)((?:\s+[-A-Za-z0-9_]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/;
var endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/;
var attr = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

// Empty Elements - HTML 4.01
var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed");

// Block Elements - HTML 4.01
var block = makeMap("address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul");

// Inline Elements - HTML 4.01
var inline = makeMap("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

// Elements that you can, intentionally, leave open
// (and which close themselves)
var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

// Attributes that have their values filled in disabled="disabled"
var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

// Special Elements (can contain anything)
var special = makeMap("script,style");



function CountRCs ( html) {
    var trCount = -2; // start at -2 to take account of two header rows in the two tables
    var currentTag;
    var seenAvailable = false;
    var seenActive = false;
    var countRCs = false;

    HTMLParser( html, {
	start: function( tagName, attrs, unary ) {
	    currentTag = tagName;
	    if (countRCs && (tagName == "tr")) {
		    trCount +=1;
		    return;
	    }
	},
	end: function( tag ) {
	    //System.out.println("End tag = " + tag + " count " + countRCs);
	    if (tag == "table") countRCs = false;
	},
	chars: function( text ) {
	    if (currentTag == "h2") {
		if (text == "Available Remote Controls") {
		    countRCs = true;
		    seenAvailable = true;
		} else if (text == "Active Remote Controls") {
		    countRCs = true;
		    seenActive = true;
		} 
	    }
	    //System.out.println("chars: currentTag " + currentTag + " text " + text + " count " + countRCs);
	},
	comment: function( text ) {
	    // create comment node
	}
    });
    
    if (!(seenActive && seenActive)) throw "Unrecognized Grid Data format";
    return trCount;
}

function HTMLParser( html, handler ) {
    var index, chars, match, stack = [], last = html;
    stack.last = function(){
    	return this[ this.length - 1 ];
    };


    var parseStartTag = function ( tag, tagName, rest, unary ) {

	//System.out.println("parseStartTag " + tag + " " + tagName + " " + rest + " " + unary);
	if ( block[ tagName ] ) {
	    while ( stack.last() && inline[ stack.last() ] ) {
		parseEndTag( "", stack.last() );
	    }
	}

	if ( closeSelf[ tagName ] && stack.last() == tagName ) {
	    parseEndTag( "", tagName );
	}

	unary = empty[ tagName ] || !!unary;

	if ( !unary )
	    stack.push( tagName );
	
	if ( handler.start ) {
	    var attrs = [];
	    
	    rest.replace(attr, function(match, name) {
		var value = arguments[2] ? arguments[2] :
		    arguments[3] ? arguments[3] :
		    arguments[4] ? arguments[4] :
		    fillAttrs[name] ? name : "";
		
		attrs.push({
		    name: name,
		    value: value,
		    escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
		});
	    });
	    
	    if ( handler.start )
		handler.start( tagName, attrs, unary );
	}
    }

    var parseEndTag= function( tag, tagName ) {

	//System.out.println("parseEndTag tag = " + tag + " tagName = " + tagName);
	// If no tag name is provided, clean shop
	if ( !tagName )
	    var pos = 0;
	
	// Find the closest opened tag of the same type
	else
	    for ( var pos = stack.length - 1; pos >= 0; pos-- )
		if ( stack[ pos ] == tagName )
		    break;
	
	if ( pos >= 0 ) {
	    // Close all the open elements, up the stack
	    for ( var i = stack.length - 1; i >= pos; i-- )
		if ( handler.end )
		    handler.end( stack[ i ] );
	    
	    // Remove the open elements from the stack
	    stack.length = pos;
	}
    }

    while ( html ) {
	chars = true;

 	// Make sure we're not in a script or style element
	if ( !stack.last() || !special[ stack.last() ] ) {

	    //System.out.println("Not Special. 1st = " + html.substring(0,1));
	    // Comment
 	    if ( html.indexOf("<!--") == 0 ) {
		index = html.indexOf("-->");
		
		if ( index >= 0 ) {
		    if ( handler.comment )
			handler.comment( html.substring( 4, index ) );
		    html = html.substring( index + 3 );
		    chars = false;
		}
		
		// end tag
	    } else if ( html.indexOf("</") == 0 ) {
		match = html.match( endTag );
		
		if ( match ) {
		    //System.out.println("E!>>>  ");
		    html = html.substring( match[0].length );
		    match[0].replace( endTag, parseEndTag );

		    //System.out.println("E!<<< Error " + (html == last));
		    chars = false;
		}
		
		// start tag
	    } else if ( html.indexOf("<") == 0 ) {
		match = html.match( startTag );
		//System.out.println("%%% execting a start tag " + match);
		
		if ( match ) {
		    //System.out.println("S!>>>");
		    html = html.substring( match[0].length );
		    match[0].replace( startTag, parseStartTag );

		    //System.out.println("S!<<< Error " + (html == last));
		    chars = false;
		}
	    }

	    if ( chars ) {
		index = html.indexOf("<");
		
		var text = index < 0 ? html : html.substring( 0, index );
		html = index < 0 ? "" : html.substring( index );
		
		if ( handler.chars )
		    handler.chars( text );
	    }

	} else {
	    //System.out.println("Special");
	    //System.out.println("X!>>> ");

	    // !@!: Bug fix. Need to ensure the strings are JS Strings - not Java strings - to ensure the 
            // replace works.
	    html = String(html).replace(new RegExp("(.*)<\/" + stack.last() + "[^>]*>"), function(all, text){
		text = String(text).replace(/<!--(.*?)-->/g, "$1").replace(/<!\[CDATA\[(.*?)]]>/g, "$1");

		//System.out.println("X!<<< Error " + (html == last) );


		if ( handler.chars )
		    handler.chars( text );

		return "";
	    });

	    parseEndTag( "", stack.last() );
	}

	if ( html == last )
	    throw "Parse Error: " + html;
	last = html;
    }
    
    // Clean up any remaining tags
    parseEndTag();

}

main();