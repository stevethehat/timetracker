(
    function ($) {
        DropBoxHelper = function () {
            var self = this;
            self.init();
        };

        DropBoxHelper.prototype.init = function () {

        }

        DropBoxHelper.prototype.authenticate = function () {
            var self = this;     
            var d = new $.Deferred();

            self.dropBoxClient = new Dropbox.Client(
                {
                    key:'cud3u6sk7p9zdmy', secret: 'sk7onlowc8pdtu9'
                }
            );

            if(self.isApp()){
                console.log('using cordova dropbox driver');
                self.dropBoxClient.authDriver(new Dropbox.Drivers.Cordova());
            } else {
                self.dropBoxClient.authDriver(new Dropbox.Drivers.Redirect());
            }
            self.dropBoxClient.authenticate(
                function(error, client){
                    self.dropBoxClient = client;
                    if(error){
                        console.log('dropbox authentication error');
                        console.log(error);
                        //self.ui.alert('Dropbox authentication failed.')
                        //callback(self, false);
                        d.reject();
                    } else {
                        console.log('dropbox connected');
                        //callback(self, true);
                        d.resolve(self);
                    }
                }
            );

            return(d.promise());
        };

        DropBoxHelper.prototype.uploadFile = function(fileName, contents, callback){
            var self = this;
            console.log('uploadFile');

            self.dropBoxClient.writeFile(fileName, contents, 
                function(error, stat){
                    console.log('uploadFile ' + error);

                    if(error){
                        callback(false);
                    } else {
                        callback(true);
                    }
                }
            );
        }

        DropBoxHelper.prototype.isApp = function(){
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
