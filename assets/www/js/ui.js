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

            var newSection = $('<section></section>', { 'id': definition.id, 'class': definition.class }).appendTo(self.root);            
            return(newSection);
        };

        UI.prototype.addList = function(definition, section){
            var self = this;

            var newList = $('<ol></ol>', { 'id': definition.id, 'class': definition.class }).appendTo(section);            
            return(newList);
        };

        UI.prototype.addOption = function(definition, list){
            var self = this;
            var newTask = null;
            if(definition.position == 'top'){
                newTask = $('<li><p>' + definition.text + '</p></li>').prependTo(list);
            } else {
                newTask = $('<li><p>' + definition.text + '</p></li>').appendTo(list);
            }

            if(definition.data){
                $.each(_.keys(definition.data),
                    function(index, item){
                        console.log('add data "' + item + '" = "' + definition.data[item] + '"');
                        newTask.data(item, definition.data[item]);
                    }
                );
            }

            if(definition.events){
                $.each(_.keys(definition.events),
                    function(index, event){
                        console.log('add event "' + event + '" = "' + definition.events[event] + '"');
                        newTask.on(event, definition.events[event]);
                    }
                );
            }

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

            alert(message);
        }

        UI.prototype.menu = function(e, definition){
            var self = this;
            e.stopPropagation();
            console.log('menu');

            var body = $('body');
            var menu = $('<div></div>', { 'id': 'menu' }).prependTo(body);

            menu.css(definition.position.use, definition.position[definition.position.use]);
            var menuList = $('<ol></ol>').appendTo(menu); 

            $.each(definition.items,
                function(index, item){
                    console.log('adding menu item ' + item['text']);
                    var newItem = null;

                    if(index == 0){
                        newItem = $('<li class="first">' + item.text + '</li>').appendTo(menuList);
                    } else {
                        newItem = $('<li>' + item.text + '</li>').appendTo(menuList);
                    }
                    
                    newItem.on('click',
                        function(e){
                            item.action();
                            menu.remove();
                            e.stopPropagation();
                        }
                    );
                }
            );
            $(document).on('click',
                function(){
                    console.log('close menu');
                    menu.remove();
                }
            );
        }


    } 
)(jQuery);
