(
    function ($) {
        DB = function (definition) {
            var self = this;
            self.init(definition);
        };

        DB.prototype.init = function (definition) {
            var self = this;     
            self.definition = definition;
            var d = $.Deferred();

            self.db = window.openDatabase(definition.name, definition.version, definition.description, definition.size);

            // check version
            self.execute('select * from version order by version desc', []).then(
                function(results){
                    console.log('DB version check');
                    console.log(results);
                    console.log('current db version = ' + results.rows.item(0).version);
                    var currentDefinition = '';
                    if(results.rows.length > 0){
                        currentDefinition = results.rows.item(0).definition;
                    }

                    if(currentDefinition != JSON.stringify(self.definition)){
                        console.log('Update DB');
                        $.when(self.initTables()).then(
                            function(){
                                d.resolve(null);
                            }
                        );
                    }
                }
            );
            return(d);
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

        DB.prototype.execute = function(command, params, transaction){
            var self = this;
            var d = $.Deferred();
            console.log('DB.execute');
            console.log(command);

            function doExecute(executeTransaction){
                executeTransaction.executeSql(command, params, 
                    function(transaction, results){
                        console.log(results);
                        console.log('execute complete');
                        d.resolve(results);
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
            return(d.promise());
        }

        DB.prototype.initTables = function(){
            var self = this;
            var promises = [];
            var d = $.Deferred();

            console.log('init versions table');
            promises.push(self.initTable(
                {
                        'name': 'version',
                        'fields': ['version', 'definition', 'date']
                }
            ));

            $.each(self.definition.tables,
                function(index, tableDefinition){
                    promises.push(self.initTable(tableDefinition));
                }
            );

            $.when(promises).then(
                function(){
                    console.log('version table available');
                    self.execute('select version from version order by version desc', []).then(
                        function(results){
                            var nextVersion = 1;
                            if(results.rows.length > 0){
                                nextVersion = Number(results.rows.item(0).version) + 1;
                            }
                            self.execute('insert into version (version, definition) values (?, ?)', [nextVersion, JSON.stringify(self.definition)]);

                            d.resolve(null);
                        }
                    );
                }
            );    
            return(d);        
        }

        DB.prototype.initTable = function(definition){
            var self = this;
            var command = 'CREATE TABLE IF NOT EXISTS ' + definition.name;

            console.log('init table');
            console.log(definition);

            var fullCommand = command + '(' + self.getFieldList(definition, true) + ')';
            console.log(fullCommand);
            return(self.execute(fullCommand));
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
                            if(field['default']){
                                fieldDetails = fieldDetails + ' default \'' + field['default'] + '\'';
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

        DB.prototype.tableAsJSON = function(tableName){
            var self = this;
            var d = new $.Deferred();

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
                                result.results.push(record);
                            }
                            d.resolve(result);
                        }                        
                    );
                }
            );
            return(d.promise());
        }

        DB.prototype.tablesAsJSON = function(){
            var self = this;
            var d = new $.Deferred();

            var result = { 'tables': [] };
            var tables = [];

            $.each(self.definition.tables,
                function(index, tableDefinition){
                    tables.push(self.tableAsJSON(tableDefinition.name));
                }
            );

            $.when.apply($, tables).then(
                function(){
                    console.log(arguments);
                    d.resolve(arguments);
                }
            );

            return(d.promise());
        }

        DB.prototype.backup = function(){
            var self = this;
            return(this.tablesAsJSON());
        }

        DB.prototype.restore = function(data){
            var self = this;
            this.reset();
            this.initTables().then(
                function(){
                    console.log('DB.restore');
                    console.log(data);

                    $.each(_.keys(data),
                        function(index, tableKey){
                            console.log('restore table');
                            var tableData = data[tableKey];
                            console.log(tableData);
                            self.restoreTable(tableData);
                        }
                    );
                }
            );
        }

        DB.prototype.restoreTable = function(data){
            var self = this;
            var name = data.definition.name;

            console.log('restoring ' + name);
            console.log(data.results);

            $.each(data.results,
                function(index, record){
                    var fields = '';
                    var values = '';
                    console.log(record);
                    var params = [];
                    var recordFields = _.keys(record);
                    $.each(recordFields,
                        function(fieldIndex, fieldName){
                            var field = record[fieldName];
                            fields = fields + ' ' + fieldName;
                            values = values + ' ? ';
                            if(fieldIndex < recordFields.length -1){
                                fields = fields + ', ';
                                values = values + ', ';
                            }
                            params.push(record[fieldName]);
                        }
                    );
                    self.execute('insert or replace into ' + name + ' (' + fields + ') values (' + values + ')', params);
                }
            );
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
