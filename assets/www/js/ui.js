(
    function ($) {
        UI = function () {
            var self = this;
            self.init();
            self.EnterKey = 13;
            self.isRunningAsApp = null;
        };

        UI.prototype.init = function () {
            var self = this;     
            self.root = $('#timetracker');      
        };

        UI.prototype.addSection = function(definition){
            var self = this;

            var newSection = $('<section></section>', { 'id': definition.id }).appendTo(self.root);            
            return(newSection);
        };

        UI.prototype.addList = function(definition, section){
            var self = this;

            var newList = $('<ol></ol>', { 'id': definition.id }).appendTo(section);            
            return(newList);
        };

        UI.prototype.addOption = function(definition, list){
            var self = this;
            var newTask = $('<li>' + definition.text + '</li>').appendTo(list);
            //newTask.data('taskID', taskID);
            //newTask.data('taskName', taskName)

            /*
            newTask.on('click touch',
                function(){
                    definition.events['click touch'](newTask);
                }
            );
*/
            return(newTask);
        };

        UI.prototype.addForm = function(definition){
            var self = this;


        };

        UI.prototype.setEnterAction = function(element, action){
            var self = this;
            element.on('keyup',
                function(e){
                    if(e.keyCode == 13){
                        action();
                    }
                }
            );
        }

        UI.prototype.isApp = function(){
            var self = this;
            if(self.isRunningAsApp == null){
                if(_.str.startsWith(window.location.href, 'http')){
                    self.isRunningAsApp = false;
                } else {
                    self.isRunningAsApp = true;
                }
            }
            return(self.isRunningAsApp);
        }

        UI.prototype.alert = function(message){
            var self = this;

        }


    } 
)(jQuery);
