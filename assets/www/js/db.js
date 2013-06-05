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

        DB.prototype.reset = function(){
            var self = this;

            self.db.transaction(
                function(transaction){
                    $.each(self.definition.tables,
                        function(index, tableDefinition){
                            transaction.executeSql('drop table ' + tableDefinition.name);
                        }
                    );
                }
            );            
        }

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
                doExecute(useTransaction);
            } else {
                self.transaction(
                    function(transaction){
                        doExecute(transaction);
                    }
                );
            }
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

            console.log('init table');
            console.log(definition);

            var fullCommand = command + '(' + self.getFieldList(definition, true) + ')';
            console.log(fullCommand);
            self.execute(fullCommand);
        }

        DB.prototype.getFieldList = function(definition, includeDetails){
            var self = this;
            var fields = '';

            $.each(definition.fields,
                function(index, field){
                    var fieldDetails = '';
                    var fieldTypeOf = typeof(field);
                    console.log('field = "' + fieldTypeOf + '"'); 
                    if(fieldTypeOf === 'object'){
                        console.log('complex field');
                        console.log(fieldDetails);
                        fieldDetails = field.name;

                        if(includeDetails){
                            if(field.unique){
                                fieldDetails = fieldDetails + ' unique';
                            }
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
            return(fields);
        }

        DB.prototype.getTableDefinition = function(tableName){
            var self = this;
            var result = null;
            $.each(self.definition.tables,
                function(index, tableDefinition){
                    if(tableDefinition.name == tableName){
                        result = tableDefinition;
                    }
                }
            );            
            return(result);
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


        DB.prototype.tableAsJSON = function(tableName, callback){
            var self = this;
            console.log('tableAsJSON ' + tableName);

            var tableDefinition = self.getTableDefinition(tableName);
            var result = {};
            result.definition = tableDefinition;
            result.results = [];

            self.transaction(
                function(transaction){
                    transaction.executeSql('select * from ' + tableName, [], 
                        function(transaction, results){
                            var len = results.rows.length, i;
                            for (i = 0; i < len; i++){       
                                var row = results.rows.item(i);   
                                var record = {};

                                $.each(_.keys(row),
                                    function(index, field){
                                        record[field] = row[field];
                                    }
                                );
                                console.log(record);
                                result.results.push(record);
                            }
                        }                        
                    );
                }
            );
            callback(result);
            return(result);
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
