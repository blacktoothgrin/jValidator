jQuery(function(){
    $f.defaults.namespace = "my_";
    
    // validates first form
    $f('.first-form').setup();
    
    if($('.second-form').length !== 0){
    
        // add another validator for the second input
        $f.prototype.checkUnique = function(){
            var $f_input = this;
            return this.each(function(){
                if(this.value.length > 10){
                    $f_input.insertError('oops! more than 10 characters');
                } else {
                    $f_input.showOk();
                }
            });
        };
        // use the new validator to check this input
        $f('#check-input').required().minlength().checkUnique().feedback();
    }
});