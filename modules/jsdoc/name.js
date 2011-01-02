/**
    @overview
    @author Michael Mathews <micmath@gmail.com>
    @license Apache License 2.0 - See file 'LICENSE.md' in this project.
 */

/**
    Functionality relating to symbol name manipulation.
    @module jsdoc/name
 */
(function() {
    var jsdoc = {
            tagDictionary: require('jsdoc/tag/dictionary')
        };
    
    var puncToScope = { '.': 'static', '~': 'inner', '#': 'instance' },
        scopeToPunc = { 'static': '.', 'inner': '~', 'instance': '#' },
        Token  = Packages.org.mozilla.javascript.Token;
        
    /**
        Resolves the sid, memberof and name values.
        @method resolve
        @param {Doclet} doclet
     */
    exports.resolve = function(doclet) {
        var name = doclet.name,
            memberof = doclet.memberof || '',
            about = {},
            parentDoc;

// TODO
//      if (currentModule) {
//          name = name.replace(/^exports\.(?=.+$)/, currentModule + '.');
//      }
        
        name = name? (''+name).replace(/\.prototype\.?/g, '#') : '';

        if (memberof) { // @memberof tag given
            memberof = memberof.replace(/\.prototype\.?/g, '#');
            
            // the name is a fullname, like @name foo.bar, @memberof foo
            if (name.indexOf(memberof) === 0) {
                about = exports.shorten(name);
            }
            else if ( /([#.~])$/.test(memberof) ) { // like @memberof foo# or @memberof foo~
                about = exports.shorten(memberof + name);
            }
            else if ( doclet.scope ) { // like @memberof foo# or @memberof foo~
                about = exports.shorten(memberof + scopeToPunc[doclet.scope] + name);
            }
        }
        else { // no @memberof
             about = exports.shorten(name);
        }
        
        if (about.name) {
            doclet.name = about.name;
        }
        
        if (about.memberof) {
            doclet.memberof = about.memberof;
        }
        
        if (about.longname) {
            doclet.longname = about.longname;
        }
        
        if (about.scope) {
            doclet.scope = puncToScope[about.scope];
        }
        else {
            if (doclet.name && doclet.memberof) {
                doclet.scope = 'static'; // default scope when none is provided
                doclet.longname = doclet.memberof + scopeToPunc[doclet.scope] + doclet.name;
            }
        }
    }
    
    function quoteUnsafe(name, kind) { // docspaced names may have unsafe characters which need to be quoted by us
        if ( (jsdoc.tagDictionary.lookUp(kind).setsDocletDocspace) && /[^$_a-zA-Z0-9\/]/.test(name) ) {
            if (!/^[a-z_$-\/]+:\"/i.test(name)) {
                return '"' + name.replace(/\"/g, '"') + '"'
            }
        }
        
        return name;
    }
    
    /**
        Given a longname like "a.b#c", slice it up into ["a.b", "#", 'c'],
        representing the memberof, the scope, and the name.
     */
    exports.shorten = function(longname) {
        //// quoted strings in a longname are atomic, convert to tokens
        var atoms = [], token; 
        longname = longname.replace(/(".*?")/g, function($) {
            token = '@{' + atoms.length + '}@';
            atoms.push($);
            return token;
        });
        ////

        var name = longname.split(/[#.~]/).pop(),
            scope = longname[longname.length - name.length - 1] || '', // ., ~, or #
            memberof = scope? longname.slice(0, longname.length - name.length - 1) : '';

        //// restore quoted strings back again
        var i = atoms.length;
        while (i--) {
            memberof = memberof.replace('@{'+i+'}@', atoms[i]);
            name   = name.replace('@{'+i+'}@', atoms[i]);
        }
        ////
        
        return {longname: longname, memberof: memberof, scope: scope, name: name};
    }   
})();