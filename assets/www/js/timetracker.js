(
    function ($) {
        TimeTracker = function () {
            var self = this;
            self.init();
        };

        TimeTracker.prototype.init = function () {
            var self = this;     
            //self.reset();    
            self.preferences = {
                'showSearch': false,
                'homeScreenResults': 10,
                'timeUpdateFrequency': 10000
            }
            self.ui = new UI();  

            var dbDefinition = {
                'name': 'timetracker', 'version': '1.0', 'description': 'timetracker database',
                'tables': [
                    {
                        'name': 'tasks',
                        'fields': [{'name': 'id', 'unique': true}, {'name': 'state', 'default': 'a'}, 'title', 'laststarttime', {'name': 'duration', 'default': '0'}, 'notes'],
                        'initialRecords': [ { 'id': 'idle', 'state': 'a', 'title': 'Idle', 'duration': '0' } ]
                    },
                    {
                        'name': 'events',
                        'fields': [{ 'name':'id', 'unique': true }, {'name': 'state', 'default': 'a'}, 'taskid', 'starttime', 'endtime', {'name': 'duration', 'default': '0'}]
                    }
                ]
            }
            self.DB = new DB(dbDefinition);

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
                    { 'text': 'Backup', 'action': function(){ self.backup(); } },
                    { 'text': 'Restore', 'action': function(){ self.restore(); } },
                    { 'text': 'DB Version', 'action': function() { self.dbVersion(); } }
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

            self.DB.transaction(function (transaction) {
                console.log('init');
                //self.initTables(transaction);
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
           
            self.DB.transaction(function (transaction) {
                self.showRecent(transaction, self.home.recentTasks);
                self.populateClients(transaction);
            });

            var header = $('.header');
            if(self.preferences.showSearch){
                var div = $('<div id="searchContainer"/>').appendTo(header);
                var search = $('<input type="text" id="search" placeholder="Search"/>').appendTo(div);
            }
            $('#timetracker').css('margin-top', header.height());
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

                self.DB.transaction(
                    function(transaction){
                        transaction.executeSql('insert into tasks (id, title) values (?, ?)', [taskID, taskName],
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

            self.ui.vibrate();
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
                }, self.preferences.timeUpdateFrequency);
            //
        }

        TimeTracker.prototype.addEvent = function(taskID, nowUnix){
            var self = this;
            console.log('addEvent ' + taskID);
            self.DB.transaction(
                function(transaction){
                    transaction.executeSql('insert into events (id, taskid, starttime) values (?, ?, ?)', [self.generateGUID(), taskID, nowUnix],
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

        TimeTracker.prototype.manage = function(){

        }
       
        TimeTracker.prototype.backup = function(){
            var self = this;
            var dump = null;

            $.when(self.DB.tablesAsJSON(), new DropBoxHelper().authenticate()).done(
                function(tablesData, dropBox){
                    console.log(tablesData);

                    $.when(dropBox.uploadFile('timetracker-backup.json', JSON.stringify(tablesData))).done(
                        function(){
                            self.ui.alert('Backup to dropbox complete.', 'Backup');
                        }
                    ).fail(
                        function(){
                            self.ui.alert('Backup to dropbox error.', 'Backup');
                        }
                    );
                }
            ).fail(
                function(){

                }
            );
        }       

        TimeTracker.prototype.restore = function(){
            var self = this;

            $.when(new DropBoxHelper().authenticate()).done(
                function(dropBox){
                    $.when(dropBox.downloadFile('timetracker-backup.json')).done(
                        function(data){
                            self.DB.restore(JSON.parse(data));
                        }
                    ).fail(
                        function(){

                        }
                    );
                }
            ).fail(
                function(){

                }
            );
        }

        TimeTracker.prototype.sync = function(){

        }

        TimeTracker.prototype.report = function(){
            var self = this;
            self.DB.transaction(
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

        TimeTracker.prototype.upload = function(){
            var self = this;
            console.log('upload');

            self.createReport(
                function(contents){
                    var dropBox = new DropBoxHelper(
                        function(dropBox){
                            dropBox.uploadFile('timetracker-report.csv', contents,
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
            );
        }

        TimeTracker.prototype.createReport = function(callback){
            var self = this;
            var output = '';

            self.DB.transaction(
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

        TimeTracker.prototype.reset = function(){
            var self = this;
            console.log('reset');
            self.DB.reset();
        }

        TimeTracker.prototype.dbVersion = function(){
            var self = this;
            self.DB.tableAsJSON('version').then(
                function(data){
                    alert(JSON.stringify(data));
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
