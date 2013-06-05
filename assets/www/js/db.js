(
    function ($) {
        DB = function (definition) {
            var self = this;
            self.init(definition);
        };

        DB.prototype.init = function (definition) {
            var self = this;     
            self.definition = definition;
            self.db = window.openDatabase(definition.name, definition.version, definition.description, definition.size);
            self.initTables();
        };

        DB.prototype.transaction = function(callback){
            var self = this;
            self.db.transaction(callback);
        }

        DB.prototype.execute = function(command, params, callback, transaction){
            var self = this;

            function doExecute(executeTransaction){
                executeTransaction.executeSql(command, [], 
                    function(transaction, results){
                        console.log(results);
                    }
                );
            }

            var useTransaction = transaction;

            if(useTransaction){

            } else {

            }

            self.transaction(
                function(transaction){
                      
                }
            );
        }

        DB.prototype.initTables = function(){
            var self = this;

            $.each(self.definition.tables,
                function(index, tableDefinition){
                    self.initTable(tableDefinition);
                }
            );            
        }

        DB.prototype.initTable = function(definition){
            var self = this;
            var command = 'CREATE TABLE IF NOT EXISTS ' + definition.name;
            var fields = '';

            console.log('init table');
            console.log(definition);

            $.each(definition.fields,
                function(index, field){
                    var fieldDetails = '';
                    var fieldTypeOf = typeof(field);
                    console.log('field = "' + fieldTypeOf + '"'); 
                    if(fieldTypeOf === 'object'){
                        console.log('complex field');
                        console.log(fieldDetails);
                        fieldDetails = field.name;

                        if(field.unique){
                            fieldDetails = fieldDetails + ' unique';
                        }
                    } else {
                        fieldDetails = field;
                    }
                    if(index == 0){
                        fields = fields + fieldDetails;
                    } else {
                        fields = fields + ',' + fieldDetails;
                    }
                }
            );

            var fullCommand = command + '(' + fields + ')';
            console.log(fullCommand);
            self.execute(fullCommand);
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
