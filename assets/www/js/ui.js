(
    function ($) {
        UI = function () {
            var self = this;
            self.init();
        };

        UI.prototype.init = function () {
            var self = this;     
            self.root = $('#taskList');      
        };
    } 
)(jQuery);
