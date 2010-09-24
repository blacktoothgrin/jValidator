// creating my own bind-to-object function. Not a big fan of the jQuery.proxy syntax!
 Function.prototype.attachTo = function (){
    if(typeof Function.prototype.bind === "undefined"){
        var _method = this,
             slice = Array.prototype.slice,
            args = slice.call(arguments),  
             object = args.shift(); // because first argument is the object. 'args' now has one element less
         
             return function(){
                 return _method.apply(object, args.concat(slice.call(arguments)));
             };
    } else {
        return Function.prototype.bind;
    }      
 };


(function($, window, document, undefined){
    
    // method that returns a regex object
    function _getRegex(type, arg){
        return PForm.patterns[type] ? new RegExp(PForm.patterns[type].toString().replace("%myval%", arg).replace(/^\/|\/$/gi,'')) :
                    new RegExp(type, arg);
    }
    
    // console.log
    function _log(msg) {
      if(window.console) {
         console.debug(msg);
      } else {
         alert(msg);
      }
    }
    
    function _setValid(val){
        this['_data'] = val;
    }
    
    function _isFunction(fn) {
        return typeof fn === "function"
    }
    
    function _setMsg(msg){
        this['_msg'] = msg;
    }
    
    /**
     * @desc Extracts the name of validator and the event that triggers it from the className (such as "jb_ajax_evt_keyup jb_email" ) of the input field
     * @return Array e.g [{ 'name' : 'email', 'event' : 'blur' }, { 'name' : 'ajax', 'event' : 'keyup' }]
     */
    function _getNSValidatorName(elem){
        var patt = _getRegex('\\b'+PForm.defaults.namespace+'([a-zA-Z]+)(?:_evt_([a-zA-Z]+))*\\b'),
            classes = elem.className,
            vnames = [],
            tmp = classes.replace(/\b\w+_(required|minlength|maxlength|integer)(_evt_[a-zA-Z])*\b/g, "");

        while(match = patt.exec(tmp)) {
            var event = match[2] || PForm.defaults.evt;
            vnames[vnames.length] = {'name': match[1], 'event' : event};
            tmp = tmp.replace(_getRegex('\\b'+PForm.defaults.namespace+match[1]+'\\w*\\b'), "");
        }
        return vnames;
    }
    
    /**
     * @desc Wrapper for each validator.
     * @return PForm object
     */
    function _wrapper(){
        var a = arguments, type = a[0], input = this[0];
        if(input['_data'] && $(input).attr('class').match(PForm.defaults.namespace + type)){
            var l = a.length,
                param = !_isFunction(a[1]) ? a[1] : '';
            try{
                _setValid.call(input, a[l-1].apply(input));
                _setMsg.call(input, PForm.messages[this.locale][type].replace("%myval%", param));
            } catch(e){
                _log(e);
            }
        }
        return this;
    }
    
    var PForm = function(node){
        return new PForm.prototype.init(node);
    };
    
    PForm.defaults = {
       namespace : 'jb_',
       evt : 'blur.validate',
       ajax : false,
       locale : 'en',
       errorClass : '.negative',
       successClass : '.positive',
       combo: '.negative, .positive',
       basic_check: 'basic'
    };
    
    PForm.patterns = {
        'required' : /./,
        'minlength' : /^.{%myval%,}$/,
        'integer' : /^\d+$/,
        'email' : /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_])+\.([A-Za-z]{2,4})$/,
        'username' : /^([^<>\?\{\}\[\]\\\^\%]*)$/
    };
    
    PForm.messages = {
        'en' : {  // locale
            'required' : 'Required',
            'minlength' : 'Min %myval% chars',
            'maxlength' : 'Max %myval% chars',
            'email' : 'Invalid email',
            'username' : 'Invalid chars',
            'location' : 'Select location',
            'password' : "Doesn't match"
        }
    };
    
    PForm.prototype = { 
    	fields : '',
    		 
        locale: 'en',
        
        init: function (node){
            // process node
            var chk = typeof node, elem;
            if(chk === "string"){
                var elem_name = node.replace(/^#|\./,''), body = document.getElementsByTagName('body')[0], opts = ['#', '.', node.charAt(0)];
                elem = function loop(){
                    if(_getRegex('^' + opts[0] + '\\w+$').test(node)){
                        var l = opts.length;
                        return l == 3 ? [document.getElementById(elem_name)] :
                            (l == 2) ? body.getElementsByClassName(elem_name) : body.getElementsByTagName(elem_name);
                    } else {
                      opts.shift();
                      return loop();
                    }
                }();
            } else {
                elem = [node];
            }
            this.length = len = elem.length;
            //elem = Array.prototype.slice(elem);console.log(elem);
            while(len--){
                var tmp = this[len] = elem[len];
                if(!tmp.hasOwnProperty('_data')) {
                    elem[len]['_data'] = true;
                }
            }
            return this instanceof PForm ? this : [];
        },
        
        isValid: function(){
            return this['_data'] || this[0]['_data'];        
        },
        
        setValid: function(val){
        	return this.each(function(){
        		this['_data'] = val;
        	});
        },
        
        required: function(){
            _wrapper.call(this, 'required', function(){
                return _getRegex('required').test(this.value);
            });
            return this;
        },
        
        email: function(){
            _wrapper.call(this, 'email', function(){
                return _getRegex('email').test(this.value);
            });
            return this;
        },
        
        minLength: function(limit){
            limit = typeof limit === "undefined" ? this[0].getAttribute('minlength') || 6 : limit;
            _wrapper.call(this, 'minlength', limit, function(){
            	if(this.value.length >= 1) {
            		return _getRegex('minlength', limit).test(this.value);
            	} else {
            		return true;
            	}
            });
            return this;
        },
        
        maxLength: function(limit){
        	limit = typeof limit === "undefined" ? this[0].getAttribute('maxlength') || 3000 : limit;
            _wrapper.call(this, 'maxlength', limit, function(){
                return this.value.length <= limit;
            });
            return this;
        },
        
        username: function(keyCode, type){
        	_wrapper.call(this, 'username', function(){
                return _getRegex('username').test(this.value);
            });
            return this;
        },
        
        integer: function(){
            _wrapper.call(this, 'integer', function(){
                return _getRegex('integer').test(this.value);
            });
            return this;
        },
        
        password: function(){
        	_wrapper.call(this, 'password', function(){
        		if(this === PForm.pwd[1] && this.value !== PForm.pwd[0].value) {
        			return false;
        		}
        		return true;
        	});
        	return this;
        },
        
        noop: function(){
        	return this;
        },
        
        each: function(func){
            var l = this.length;
            while(l--){
               func.apply(this[l]);
            }
            return this;
        },
        
        addValidators : function(v){
            for(key in v){
                PForm.messages[this.locale][key] = key + ' is invalid';
                var oldv = v[key],
                    fn = function(){
                        _wrapper.call(this, key, oldv);
                    };
                v[key] = fn;
            }
    
            $.extend(PForm.fn, v || {});
            return this;
        },
        
        validateWith : function(v){
            return this.each(function(){
                var vld = _getNSValidatorName(this)[0],
                    key = vld['name'];
                var fn = function(){
                    this.wrapper(key, v);
                };
                $.extend(PForm.fn, { key : fn });
            });
        },
        
        showOk: function(msg){
            return this.each(function(){
                var $this = $(this), $parent = $this.siblings(PForm.defaults.feedback);
                
                if(typeof $this.data('error') !== "undefined") { // customized check for jogabo :( :(
                	$parent.find(PForm.defaults.successClass).hide();
                } else {
                	$parent.find(PForm.defaults.combo).hide();
                }
                
                if(typeof $this.data('error') === "undefined" && $this.val().length > 0){ 
                	msg = msg || '✓ OK';
                    if(PForm.defaults.feedback) {
                    	$parent.find(PForm.defaults.successClass).show().html(msg);
                    } else {
                    	$this.next(PForm.defaults.feedback).remove().end().after('<div> '+ msg + '</div>').next().addClass(PForm.defaults.successClass.slice(1));
                    }
                }
            });
        },
        
        insertError : function(msg){
            return this.each(function(){
                var $this = $(this);
                msg = msg || this['_msg'];
                
                if(PForm.defaults.feedback) {
                	log($this.siblings(PForm.defaults.feedback).find(PForm.defaults.combo));
                	$this.siblings(PForm.defaults.feedback).find(PForm.defaults.combo).hide().end().find(PForm.defaults.errorClass).show()
                	.html(msg);
                } else {
                	$this.next(PForm.defaults.feedback).remove().end().after('<div> '+ msg + '</div>').next().addClass(PForm.defaults.errorClass.slice(1));
                }
                _setValid.call(this, true);
            });
        },
        
        feedback: function(msg){
            return this.isValid() ? this.showOk() : this.insertError();
        },
        
        // everything happens here
        // TODO refactor this
        setup: function(options){
            var jbObj = this,
                s = $.extend({}, PForm.defaults, options);
            PForm.pwd = [];
            this.locale = s.locale;
            
            function _processPasswordField(elem) {
            	if(elem.type === "password") {
            		PForm.pwd[PForm.pwd.length] = elem;
            	}
            }
            
            function _basic() {
            	// custom event for basic validation
                $(this).bind(PForm.defaults.basic_check, function(){
              	  PForm(this).required().minLength().maxLength().integer();
                }).bind(PForm.defaults.evt, function(){
              	  $(this).trigger(PForm.defaults.basic_check);
              	  PForm(this).feedback();
                });
            }
            
            function _validate(evt, vtype){
               var input = $(this),
               	   jinput = PForm(this),
               	   evt = evt || PForm.defaults.evt,
               	   vtype = vtype || 'noop';  
               
                if(evt === PForm.defaults.evt) {
                    input.unbind(evt).bind(evt, function(){
                        input.trigger(PForm.defaults.basic_check); //trigger basic check (as written in _basic function above)
                        PForm.fn[vtype].apply(jinput);  // apply the special validator for the input
                        jinput.feedback(); // display error/success messages
                    });
                } else {
                    input.bind(evt, function(e){
                    	var k = e.keyCode ? e.keyCode : e.which;
                        PForm.fn[vtype].call(jinput, k, vtype);
                    });
                }
            }

          return this.each(function(){
              if(this.nodeName === "FORM"){
              	  $(this).find('input, textarea, select').not('input:submit, input:hidden, input:button, button') 
                  .each(function(){
                	  
                	  _processPasswordField(this);
                	  
                	  _basic.attachTo(this)();
                      
                	  var v = _getNSValidatorName(this),
                	  	  vl = v.length - 1;
                	  
                	  while(vl >= 0 && PForm.fn.hasOwnProperty(vtype = v[vl].name) !== "") {
                		  var evt = v[vl].event || PForm.defaults.evt;
                		  _validate.attachTo(this)(evt, vtype);
                		  vl -= 1;
                	  }
                  });
               } else {
            	   // TODO
            	   _basic.attachTo(this)();
                   _validate.attachTo(this)();  
               }
                
            });
        },

        validate : function(){
            return this.each(function(){
                // TODO
            });
        }
    };
    
    
    PForm.fn = PForm.prototype;
    PForm.prototype.init.prototype = PForm.prototype;
    
    window.$f = PForm;
    
})(jQuery, this, this.document);
