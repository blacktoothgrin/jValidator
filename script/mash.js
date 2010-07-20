(function($, window, document, undefined){

function _getRegex(type, arg){
    return PForm.patterns[type] ? new RegExp(PForm.patterns[type].toString().replace("%myval%", arg - 1).replace(/^\/|\/$/gi,'')) :
                new RegExp(type, arg);
}

function _log(msg) {
  if(window.console) {
     console.debug(msg);
  } else {
     alert(msg);
  }
}

function _ajax(){
    
}

function _setValid(val){
    this['_data'] ? this['_data'] = val : this[0]['_data'] = val;
}

function _setMsg(msg){
    this['_msg'] = msg;
}

function _getNSValidatorName(){
    var patt = _getRegex('_evt_([a-zA-Z]+)\\b'), classes = this.className, vnames = [];
    while(match = patt.exec(classes)) {
        if(match = match[1]){
            vnames[vnames.length] = match;
        }
    }
    return vnames;
}

var PForm = function(node){
    return new PForm.prototype.init(node);
};

PForm.defaults = {
    namespace : 'pf_',
   evt : 'blur',
   ajax : false,
   locale : 'en',
   errorClass : '.error',
   successClass : '.success'
};

PForm.patterns = {
    'required' : /./,
    'minlength' : /^.{%myval%,}$/,
    'integer' : /^\d+$/,
    'email' : /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/,
    'username' : /^([^<>\?\{\}\[\]\\\^\%]*)$/
};

PForm.messages = {
    'en' : {
        'required' : 'Required',
        'minlength' : 'Min %myval% chars',
        'maxlength' : 'Max %myval% chars',
        'email' : 'Invalid email',
        'username' : 'Invalid chars',
        'myemail' : 'Something is wrong'
    }
};

PForm.prototype = {  
    locale: 'en',
    
    init: function(node){
        // process node
        var chk = typeof node, elem;
        if(chk === "string"){
            var elem_name = node.replace(/^#|\./,''), body = document.getElementsByTagName('body')[0], opts = ['#', '.', node.charAt(0)];
            elem = function(){
                if(_getRegex('^' + opts[0] + '\\w+$').test(node)){
                    var l = opts.length;
                    return l == 3 ? [document.getElementById(elem_name)] :
                        (l == 2) ? body.getElementsByClassName(elem_name) : body.getElementsByTagName(elem_name);
                } else {
                  opts.shift();
                  return arguments.callee();
                }
            }();
        } else {
            elem = [node];
        }
        this.length = len = elem.length;
        //elem = Array.prototype.slice(elem);console.log(elem);
        while(len--){
            this[len] = elem[len];
            elem[len]['_data'] = elem[len]['_data'] || true;
        }
        //console.log(this);
        return this instanceof PForm ? this : [];
    },
    
    isValid: function(){
        return this['_data'] || this[0]['_data'];        
    },
    
    getMessage: function(){
        return this.each(function(){
            return this['_msg'] || '';
        });
    }
    
    /*
    data: function(key, value){
        var that  = this;
        this.each(function(){
            return !value ? this['_data'] || '' : function(){this['_data'] = value; return that;}() 
        });
    },
    */

    required: function(arg){
        this.wrapper('required', function(){
            return _getRegex('required').test(this.value);
        });
        return this;
    },
    
    minLength: function(limit){
        limit = limit || 6;
        this.wrapper('minlength', limit, function(){
            return _getRegex('minlength', limit).test(this.value);
        });
        return this;
    },
    
    maxLength: function(limit){
            limit = limit || 3000;
        this.wrapper('maxlength', limit, function(){
            return this.value.length <= limit;
        });
        return this;
    },
    
    integer: function(){
        this.wrapper('integer', function(){
            return _getRegex('integer').test(this.value);
        });
        return this;
    },
    
    each: function(func){
        var l = this.length;
        while(l--){
           func.apply(this[l]);
        }
        //return this;
    },
    
    hasClass: function(name){
        return new RegExp(name).test(this[0].className);
    },
    
    wrapper : function(){
        if(this.hasClass(PForm.defaults.namespace + arguments[0]) && this.isValid()){
            var args = Array.prototype.slice.call(arguments), 
                 l = args.length, 
                 input = this[0],
                 type = args[0],
             arg = typeof args[1] != "function" ? args[1] : '',
             fn = typeof args[l-1] == "function" ? args[l-1] : function(){};
            try{
                _setValid.call(input, fn.apply(input));
                _setMsg.call(input, PForm.messages[this.locale][type].replace("%myval%", arg)); 
            } catch(e){
                _log(e);
            }
      }
      return this;
    },
        
    addValidators : function(v){
        for(key in v){
            var oldv = v[key],
                fn = function(){
                    this.wrapper(key, oldv);
                };
            v[key] = fn;
        }

        $.extend($f.fn, v || {});
        return this;
    },
    
    showOk: function(msg){
          var $this = $(this[0]);
          msg = msg || 'OK';        
        $this.next(PForm.defaults.feedback).remove().end().after('<div> '+ msg + '</div>').next().addClass(PForm.defaults.successClass.slice(1));
        //$(this[0]).data('invalid', true);
        return this;
    },
    
    insertError : function(msg){
        var $this = $(this[0]);
        msg = msg || this.getMessage();
        //msg = $this.data('msg', msg || $this.data('msg')).data('msg');
        $this.next(PForm.defaults.feedback).remove().end().after('<div> '+ msg + '</div>').next().addClass(PForm.defaults.errorClass.slice(1));
        //$this.data('valid', false);
        _setValid.call(this, false);
        return this;        
    },
    
    feedback: function(msg){
        return this.isValid() ? this.showOk() : this.insertError();
    },
    
    setup: function(options){
            $.extend(PForm.defaults, options || {});
            return this;
    },
    
    validate : function(options){
          var vnames;
        this.locale = options ? options.locale : $f.defaults.locale;
        $f.defaults.feedback = $f.defaults.errorClass + ', ' + $f.defaults.successClass;
        this.each(function(){
            if(this.nodeName === "FORM"){
                $(this).find('input, textarea, select')
                       .not('input:submit, input:hidden, input:button, button')
                       .unbind()
                       .each(function(){
                                $(this).bind($f.defaults.evt, _validate);
                            });
            } else {
                $(this).unbind().bind($f.defaults.evt, _validate);
            }
            
            // this block of code runs for each input field
            function _validate() {
                $(this).data('valid', true);
                
                $f(this).required().minLength().maxLength().integer().feedback(); 
                
                /*if($f.fn.hasOwnProperty('myemail')){
                    $f.fn.myemail.apply($f(this));
                    $f(this).feedback();
                }*/
            }
        });
       
    },
    
    submit : function(){
        
    }
};


PForm.fn = PForm.prototype;
PForm.prototype.init.prototype = PForm.prototype;

window.$f = PForm;

})(jQuery, this, this.document);

$.extend($f.messages['en'], { 'myemail' : "This is wrong email"});
$.extend($f.defaults, {});
$f('.pf_mycheck').addValidators({
    'check' : function(fn){
        var res = $(this).val().toLowerCase() === "jobs.steve" ? true : false;
        fn.apply();
        return
    }
}).validate();



​