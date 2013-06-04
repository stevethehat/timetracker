(
    function ($) {
        DB = function (name, version, description, size) {
            var self = this;
            self.init(name, version ,description, size);
        };

        DB.prototype.init = function (name, version ,description, size) {
            var self = this;     
            self.db = window.openDatabase(name, version, description, size);
        };

        DB.prototype.transaction = function(callback){
            var self = this;
            self.db.transaction(callback);
        }

        DB.prototype.logTable = function(tableName){
            var self = this;

            self.transaction(
                function(transaction){
                    transaction.executeSql('select * from ' + tableName, [],
                        function(transaction, results){
                            var len = results.rows.length, i;
                            for (i = 0; i < len; i++){       
                                var row = results.rows.item(i);   

                                if(self.isApp()){
                                    var record = '';
                                    // convert to string as the log viewer in eclipse is a bit shit..
                                    $.each(_.keys(row),
                                        function(index, field){
                                            record = record + field + ' = ' + row[field] + ', ';
                                        }
                                    );
                                    console.log(record);
                                } else {
                                    console.log(row);     
                                }
                            }                    
                        }
                    );
                }
            );
        }


        DB.prototype.tableAsJSON = function(tableName){
            var self = this;
        }
        DB.prototype.tablesAsJSON = function(tableNames){
            var self = this;
        }

        DB.prototype.isApp = function(){
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

    } 
)(jQuery);
