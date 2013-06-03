(
    function ($) {
        TimeTracker = function () {
            var self = this;
            self.init();
        };

        TimeTracker.prototype.init = function () {
            var self = this;     
            //self.reset();    
            self.ui = new UI();  
            self.db = self.database();

            var menuDefinition = {
                'items':[
                    { 'text': 'Manage', 'action': function(){ self.manage(); } },
                    { 'text': 'Preferences', 'action': function(){ self.preferences(); } },
                    { 'text': 'Report', 'action': function(){ self.report(); } },
                    { 'text': 'Upload', 'action': function(){ self.upload(); } },
                    { 'text': 'Reset', 'action': 
                        function(){ 
                            self.ui.confirm('Are you sure you want to reset? This will delete all tasks & events.', 'Reset', 
                                function(ok){
                                    if(ok){
                                        self.reset(); location.reload(); 
                                    } else {

                                    }
                                }
                            );
                        } 
                    },
                    { 'text': 'Log tables', 'action': 
                        function(){ 
                            var db = self.database();

                            db.transaction(
                                function(transaction){
                                    self.logTable(transaction, 'tasks');
                                    self.logTable(transaction, 'events');
                                }
                            );
                        }
                    }
                ],
                'position':{
                    'use': 'top',
                    'top':'62px',
                    'bottom': '2px'
                }
            }

            $('#menuButton').on('click',
                function(e){
                    console.log('menu button click');
                    menuDefinition.position.use = 'top';
                    self.ui.menu(e, menuDefinition);
                    //alert('menu');
                }
            );

            document.addEventListener('menubutton',
                function(e){
                    menuDefinition.position.use = 'bottom';
                    self.ui.menu(e, menuDefinition);
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
            self.home.tasks = self.ui.addSection( { 'id': 'home', 'class': 'home' });
            self.home.recentTasks = self.ui.addList( { 'id': 'recentTasks', 'class': 'taskList' }, self.home.tasks);
           
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

            var newTask = self.ui.addOption( { 'id': 'addTask', 'text': '', 'position': 'bottom' }, list);
            newTask.text = '';
            var newTaskName = $('<input type="text" placeholder="New Task Name.."/>', { 'id': 'newTaskName' }).appendTo(newTask);
            newTaskName.bind('keyup',
                function(ev){
                    if(ev.keyCode == 13){
                        //alert('add event');
                        self.addTask(newTaskName, list);
                    }
                }
            );
            console.log(newTaskName);
            var lookupSql = 'SELECT * FROM tasks where state=\'a\' order by laststarttime desc';
            //var lookupSql = 'SELECT * FROM tasks limit 3';
            transaction.executeSql(lookupSql, [], 
                function (transaction, results) {
                    var len = results.rows.length, i;
                    for (i = 0; i < len; i++){       
                        var task = results.rows.item(i);   
                        console.log(task);     
                        self.addTaskToList(task.id, task.title, task.duration, list, 'top');                  
                    }
                    console.log(list);
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

                var taskID = self.generateGUID();

                self.db.transaction(
                    function(transaction){
                        transaction.executeSql('insert into tasks (id, state, title, duration) values (?, \'a\', ?, 0)', [taskID, taskName],
                            function(transaction, results){
                                console.log('addedTask')
                                console.log(results);
                                self.taskClick(self.addTaskToList(taskID, taskName, 0, list, 'top'));
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
            var now = new moment();
            var nowUnix = now.unix();

            self.addEvent(taskID, nowUnix);

            var taskDuration = Number(li.data('taskDuration'));

            li.siblings().removeClass('activeTask');
            $('p.time').remove();
            
            li.addClass('activeTask');

            var time = $('<p class="time">' + moment.duration(taskDuration).humanize() + '</p>').appendTo(li);
            li.data('starttime', nowUnix);
            console.log('added timer info');

            if(self.timer){
                clearInterval(self.timer);
            }
            self.timer = setInterval(
                function(){
                    var now = moment();
                    var eventSeconds = now.unix() - Number(li.data('starttime'));
                    var eventDuration = moment.duration(eventSeconds, 'seconds');
                    var previousTaskDuration = Number(li.data('taskDuration'));
                    var taskDuration = previousTaskDuration + eventSeconds;
                    console.log('update time spent');
                    console.log('previousTaskDuration = ' + previousTaskDuration);
                    if(previousTaskDuration == 0){
                        time.text(eventDuration.humanize());
                    } else {
                        time.text(eventDuration.humanize() + ' of ' + moment.duration(taskDuration, 'seconds').humanize());
                    }
                }, 10000);
            //
        }

        TimeTracker.prototype.addEvent = function(taskID, nowUnix){
            var self = this;
            console.log('addEvent ' + taskID);
            var db = self.database();
            db.transaction(
                function(transaction){
                    transaction.executeSql('insert into events (id, state, taskid, starttime) values (?, \'a\', ?, ?)', [self.generateGUID(), taskID, nowUnix],
                        function(transaction, results){
                            console.log('addedEvent')
                            console.log(results);

                            transaction.executeSql('update tasks set laststarttime=? where id=?', [nowUnix, taskID],
                                function(transaction, results){
                                    transaction.executeSql('select * from events order by starttime desc', [],
                                        function(transaction, results){
                                            // get last event
                                            if(results.rows.length >= 2){
                                                var lastEvent = results.rows.item(1);
                                                var starttime = lastEvent.starttime;
                                                var duration = nowUnix - Number(starttime);
                                                var eventID = lastEvent.id;
                                                var lastTaskID = lastEvent.taskid;

                                                transaction.executeSql('update events set endtime=?, duration=? where id=?', [nowUnix, duration, eventID],
                                                    function(transaction, results){
                                                        transaction.executeSql('update tasks set duration = duration + ? where id=?', [duration, lastTaskID],
                                                            function(transaction, results){
                                                                console.log('task duration update');
                                                                console.log(results);
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }

        TimeTracker.prototype.addTaskToList = function(taskID, taskName, duration, list, position){
            var self = this;
            console.log('addTaskToList ' + taskID + ' ' + taskName);

            var newOption = self.ui.addOption(
                {
                    'text': taskName,
                    'position': position,
                    'data': {
                        'taskID': taskID,
                        'taskName': taskName,
                        'taskDuration': duration
                    },
                    'events': {
                        'click touch': function(option){
                            self.taskClick(newOption);
                        },
                        'swiperight': function(option){
                            self.ui.alert('swipe right');
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
            //transaction.executeSql('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, title, laststarttime, duration)');
            //transaction.executeSql('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, taskid, starttime, endtime, duration)');
            transaction.executeSql('CREATE TABLE IF NOT EXISTS tasks (id, state, title, laststarttime, duration)');
            transaction.executeSql('CREATE TABLE IF NOT EXISTS events (id, state, taskid, starttime, endtime, duration)');
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

            self.createReport(
                function(output){
                    alert(output);
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

            if(self.ui.isApp()){
                console.log('using cordova dropbox driver');
                dropBoxClient.authDriver(new Dropbox.Drivers.Cordova());
            } else {
                dropBoxClient.authDriver(new Dropbox.Drivers.Redirect());
            }
            dropBoxClient.authenticate(
                function(error, client){
                    if(error){
                        //alert('dropbox error');
                        console.log('dropbox authentication error');
                        console.log(error);
                        self.ui.alert('Dropbox authentication failed.')
                    } else {
                        //alert('dropbox connect');
                        console.log('dropbox connected');
                        self.createReport(
                            function(contents){
                                self.uploadFile(dropBoxClient, 'timetracker-report.csv', contents,
                                    function(ok){
                                        if(ok){
                                            self.ui.alert('Upload to dropbox complete.', 'Upload');
                                        } else {
                                            self.ui.alert('Upload to dropbox error.', 'Upload');
                                        }
                                    }
                                );
                            }
                        );
                    }
                }
            );
        }

        TimeTracker.prototype.uploadFile = function(dropBoxClient, filename, contents, callback){
            var self = this;

            contents
            dropBoxClient.writeFile(filename, contents,
                function(error, stat){
                    if(error){
                        console.log(error);
                        callback(false);
                    } else {
                        console.log(stat);
                        callback(true);
                    }
                }
            );
        }

        TimeTracker.prototype.createReport = function(callback){
            var self = this;
            var db = self.database();
            var output = '';

            db.transaction(
                function(transaction){
                    transaction.executeSql('select * from tasks', [],
                        function(transaction, results){
                            var len = results.rows.length, i;
                            for (i = 0; i < len; i++){ 
                                var row = results.rows.item(i);
                                var id = row.id;
                                var taskName = row.title;
                                var duration = moment.duration(Number(row.duration), 'seconds');
                                var realTime = duration.days() + ':' + duration.hours() + ':' + duration.minutes();

                                output = output + taskName + ',' + duration + ',' + duration.humanize() + ',' + realTime + '\n';
                            }
                            callback(output);
                        }
                    );
                }
            );
        }

        TimeTracker.prototype.dumpTable = function(tableName, callback){
            var self = this;
            var db = self.database();
            var result = '';

            console.log('dumpTable ' + tableName);

            db.transaction(
                function(transaction){
                    transaction.executeSql('select * from ' + tableName, [],
                        function(transaction, results){
                            var len = results.rows.length, i;
                            for (i = 0; i < len; i++){       
                                var row = results.rows.item(i); 
                                $.each(_.values(row),
                                    function(index, value){
                                        if(index == 0){
                                            result = result + value;
                                        } else {
                                            result = result + ',' + value;
                                        }
                                    }
                                );  
                                result = result + '\n';
                                console.log(row);     
                            }
                            callback(result);
                        }
                    );
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

        TimeTracker.prototype.preferences = function(){

        }

        TimeTracker.prototype.generateGUID = function(){
            var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                }
            );     
            return guid;
        }
    } 
)(jQuery);
