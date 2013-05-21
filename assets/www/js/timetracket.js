(
    function ($) {
        TimeTracker = function () {
            var self = this;
            self.init();
        };

        TimeTracker.prototype.init = function () {
            var self = this;           
            var db = self.database();

            $('#addTask').on('click',
                function(){
                    self.addTask();
                }
            );

            db.transaction(function (transaction) {
                self.initTables(transaction);
                self.showRecent(transaction);
            });
        };

        TimeTracker.prototype.showRecent = function(transaction){
            var self = this;
            transaction.executeSql('SELECT * FROM tasks', [], 
                function (transaction, results) {
                    var len = results.rows.length, i;
                    for (i = 0; i < len; i++)                                 
                        alert(results.rows.item(i).text);
                    }
                }
            );
        }

        TimeTracker.prototype.addTask = function(){

        }

        TimeTracker.prototype.addEvent = function(){

        }

        TimeTracker.prototype.database = function(){
            var self = this;
            return(openDatabase('timetracker', '1.0', 'timetracker database', 2 * 1024 * 1024));
        }

        TimeTracker.prototype.initTables = function(transaction){
            var self = this;
            transaction.executeSql('CREATE TABLE IF NOT EXISTS tasks (id unique, title)');
            transaction.executeSql('CREATE TABLE IF NOT EXISTS events (id unique, datetime)');
        }   
    } 
)(jQuery);
