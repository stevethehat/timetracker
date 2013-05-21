(
    function ($) {
        TimeTracker = function () {
            var self = this;
            self.init();
        };

        TimeTracker.prototype.init = function () {
            var self = this;           
            var db = self.database();

            $('#doAddTask').click(
                function(){
                    console.log('addTaskClick');
                    self.addTask();
                }
            );

            db.transaction(function (transaction) {
                console.log('init');
                self.initTables(transaction);
                self.showRecent(transaction);
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

        TimeTracker.prototype.showRecent = function(transaction){
            var self = this;
            console.log('showRecent');
            transaction.executeSql('SELECT * FROM tasks', [], 
                function (transaction, results) {
                    var len = results.rows.length, i;
                    for (i = 0; i < len; i++){       
                        var task = results.rows.item(i);   
                        console.log(task);     
                        self.addTaskToList(task.id, task.title);                  
                    }
                }
            );
        }

        TimeTracker.prototype.addTask = function(){
            var self = this;
            console.log('addTask');
            var taskName = $('#newTaskName').val();
            $('#newTaskName').val('');

            var taskID = 1;

            var db = self.database();
            db.transaction(
                function(transaction){
                    transaction.executeSql('insert into tasks (title) values (?)', [taskName],
                        function(transaction, results){
                            console.log('addedTask')
                            console.log(results);
                            self.taskClick(self.addTaskToList(results.insertId, taskName));
                        }
                    )
                }
            );
        }

        TimeTracker.prototype.taskClick = function(li){
            var self = this;
            console.log('taskClick');
            console.log(li);
            var taskID = li.data('taskID');

            self.addEvent(taskID);
            $('#taskList li').removeClass('activeTask');
            li.addClass('activeTask');
            //li.css('background-color', 'green');


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
                        }
                    )
                }
            );
        }

        TimeTracker.prototype.addTaskToList = function(taskID, taskName){
            var self = this;
            console.log('addTaskToList ' + taskID + ' ' + taskName);
            var taskList = $('#taskList');
            var newTask = $('<li>' + taskName + '</li>').prependTo(taskList);
            newTask.data('taskID', taskID);

            newTask.click(
                function(){
                    self.taskClick(newTask);
                }
            );

            return(newTask);
        }

        TimeTracker.prototype.database = function(){
            var self = this;
            return(openDatabase('timetracker', '1.0', 'timetracker database', 2 * 1024 * 1024));
        }

        TimeTracker.prototype.initTables = function(transaction){
            var self = this;
            transaction.executeSql('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, title)');
            transaction.executeSql('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, taskid, datetime)');
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
