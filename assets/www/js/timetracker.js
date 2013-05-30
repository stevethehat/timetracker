(
    function ($) {
        TimeTracker = function () {
            var self = this;
            self.init();
        };

        TimeTracker.prototype.init = function () {
            var self = this;     
            self.reset();    
            self.ui = new UI();  
            self.db = self.database();

            /*
            $('#doAddTask').on('click touch',
                function(){
                    console.log('addTaskClick');
                    self.addTask();
                }
            );
            */
            var menuDefinition = {
                'items':[
                    { 'text': 'Manage', 'action': function(){ self.manage(); } },
                    { 'text': 'Report', 'action': function(){ self.report(); } },
                    { 'text': 'Upload', 'action': function(){ self.upload(); } },
                    { 'text': 'Reset', 'action': function(){ self.reset(); location.reload(); } }
                ]
            }

            $('#menuButton').on('click',
                function(){
                    console.log('menu button click');
                    self.ui.menu(menuDefinition);
                    //alert('menu');
                }
            );

            self.db.transaction(function (transaction) {
                console.log('init');
                self.initTables(transaction);
            });
           self.showHome();
        };

        TimeTracker.prototype.clearPages = function(){
            var self = this;
            self.home = null;
        };

        TimeTracker.prototype.showHome = function(transaction){
            var self = this;
            self.home = new Object();
            self.home.tasks = self.ui.addSection( { 'id': 'home' });
            self.home.recentTasks = self.ui.addList( { 'id': 'recentTasks' }, self.home.tasks);
           
            self.db.transaction(function (transaction) {
                self.showRecent(transaction, self.home.recentTasks);
                self.populateClients(transaction);
            });
        };

        TimeTracker.prototype.populateClients = function(transaction){
            var self = this;
            var clientsSelector = $('#clients');

            function addClient(clientID, clientName){
                var client = $('<option value="' + clientID + '">' + clientName + '</option>').appendTo(clientsSelector);
            }
            addClient(-1, 'No Client');
        }

        TimeTracker.prototype.showRecent = function(transaction, list){
            var self = this;
            console.log('showRecent');
            var lookupSql = 'SELECT * FROM tasks order by latestevent desc';
            //var lookupSql = 'SELECT * FROM tasks limit 3';
            transaction.executeSql(lookupSql, [], 
                function (transaction, results) {
                    var len = results.rows.length, i;
                    for (i = 0; i < len; i++){       
                        var task = results.rows.item(i);   
                        console.log(task);     
                        self.addTaskToList(task.id, task.title, list, 'bottom');                  
                    }
                    console.log(list);

                    var newTask = self.ui.addOption( { 'id': 'addTask', 'text': '', 'position': 'bottom' }, list);
                    newTask.text = '';
                    var newTaskName = $('<input tupe="text"/>', { 'id': 'newTaskName' }).appendTo(newTask);
                    newTaskName.bind('keyup',
                        function(ev){
                            if(ev.keyCode == 13){
                                //alert('add event');
                                self.addTask(newTaskName, list);
                            }
                        }
                    );
                    console.log(newTaskName);
                }
            );
        }

        TimeTracker.prototype.addTask = function(newTaskName, list){
            var self = this;
            console.log('addTask');
            //var newTaskName = $('#newTaskName');
            console.log(newTaskName);
            var taskName = newTaskName.val();

            if(taskName != ''){
                newTaskName.val('');

                console.log('addTask "' + taskName + '"');

                var taskID = 1;

                self.db.transaction(
                    function(transaction){
                        transaction.executeSql('insert into tasks (title) values (?)', [taskName],
                            function(transaction, results){
                                console.log('addedTask')
                                console.log(results);
                                self.taskClick(self.addTaskToList(results.insertId, taskName, list, 'top'));
                            }
                        )
                    }
                );
            }
        }

        TimeTracker.prototype.taskClick = function(li){
            var self = this;
            console.log('taskClick');
            console.log(li);
            var taskID = li.data('taskID');

            self.addEvent(taskID);
            li.siblings().removeClass('activeTask');
            //$('#taskList li').removeClass('activeTask');
            li.addClass('activeTask');
            //li.css('background-color', 'green');
            //
        }

        TimeTracker.prototype.addEvent = function(taskID){
            var self = this;
            console.log('addEvent ' + taskID);
            var db = self.database();
            db.transaction(
                function(transaction){
                    transaction.executeSql('insert into events (taskid, datetime) values (?, ?)', [taskID, new Date()],
                        function(transaction, results){
                            console.log('addedEvent')
                            console.log(results);

                            transaction.executeSql('update tasks set latestevent=? where id=?', [results.insertId, taskID])
                        }
                    );
                }
            );
        }

        TimeTracker.prototype.addTaskToList = function(taskID, taskName, list, position){
            var self = this;
            console.log('addTaskToList ' + taskID + ' ' + taskName);

            var newOption = self.ui.addOption(
                {
                    'text': taskName,
                    'position': position,
                    'data': {
                        'taskID': taskID,
                        'taskName': taskName
                    },
                    'events': {
                        'click touch': function(option){
                            self.taskClick(newOption);
                        }
                    }
                }, list
            );
            return(newOption);
        }

        TimeTracker.prototype.database = function(){
            var self = this;
            console.log('database')
            return(window.openDatabase('timetracker', '1.0', 'timetracker database', 2 * 1024 * 1024));
        }

        TimeTracker.prototype.initTables = function(transaction){
            var self = this;
            transaction.executeSql('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, title, latestevent)');
            transaction.executeSql('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, taskid, datetime)');
        }   

        TimeTracker.prototype.manage = function(){

        }

        TimeTracker.prototype.report = function(){
            var self = this;
            var db = self.database();
            db.transaction(
                function(transaction){
                    console.log('tasks');
                    self.logTable(transaction, 'tasks');
                    console.log('events');
                    self.logTable(transaction, 'events');
                }
            );
        }

        TimeTracker.prototype.logTable = function(transaction, tableName){
            transaction.executeSql('select * from ' + tableName, [],
                function(transaction, results){
                    var len = results.rows.length, i;
                    for (i = 0; i < len; i++){       
                        var row = results.rows.item(i);   
                        console.log(row);     
                    }                    
                }
            );
        }

        TimeTracker.prototype.upload = function(){
            var self = this;
            console.log('upload');

            var dropBoxClient = new Dropbox.Client(
                {
                    key:'cud3u6sk7p9zdmy', secret: 'sk7onlowc8pdtu9'
                }
            );
            dropBoxClient.authDriver(new Dropbox.Drivers.Redirect());
            dropBoxClient.authenticate(
                function(error, client){
                    if(error){
                        console.log('dropbox authentication error');
                    } else {
                        console.log('dropbox connected')
                    }
                }
            );
        }

        TimeTracker.prototype.reset = function(){
            var self = this;
            console.log('reset');

            var db = self.database();
            db.transaction(
                function(transaction){
                    transaction.executeSql('drop table tasks', []);
                    transaction.executeSql('drop table events', []);
                }
            );            
        }
    } 
)(jQuery);
