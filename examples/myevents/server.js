
/**
 * Module dependencies.
 */ 
 
var express = require('express') 
  , routes = require('./routes')  
  , uuid = require('node-uuid')
  , EventService = require('./EventService')
  , azure = require('azure'); 
 
var app = module.exports = express.createServer(); 
app.use(express.bodyParser());
app.use(express.bodyParser({
    uploadDir: '/tmp/uploads'
}));

//var tableClient = azure.createTableService(ServiceClient.DEVSTORE_STORAGE_ACCOUNT, ServiceClient.DEVSTORE_STORAGE_ACCESS_KEY, ServiceClient.DEVSTORE_TABLE_HOST); 
//var blobClient = azure.createBlobService(azure.ServiceClient.DEVSTORE_STORAGE_ACCOUNT, azure.ServiceClient.DEVSTORE_STORAGE_ACCESS_KEY, azure.ServiceClient.DEVSTORE_BLOB_HOST).withFilter(new azure.ExponentialRetryPolicyFilter());

var tableClient = azure.createTableService("nodesummitworkshop", "Ta+1p/19QrOPbsRl0eNzGyxd7Ths0Qp2qpNyob8FyERIBhzbsFtPgn70RdAmrUJsDrYbTX2DJwEzZ8syRNw/Xg=="); 
var blobClient = azure.createBlobService("nodesummitworkshop", "Ta+1p/19QrOPbsRl0eNzGyxd7Ths0Qp2qpNyob8FyERIBhzbsFtPgn70RdAmrUJsDrYbTX2DJwEzZ8syRNw/Xg==").withFilter(new azure.ExponentialRetryPolicyFilter());
 
// Create table and blob
tableClient.createTableIfNotExists('events', function(error) { 
  if (error) {
    throw error;
  } 
});
blobClient.createContainerIfNotExists('photos', function(error) { 
  if (error) {
    throw error;
  }
  blobClient.setContainerAcl('photos', azure.Constants.BlobConstants.BlobContainerPublicAccessType.BLOB, function (error1) {
        if (error1) {
          throw error1;
        }
  });
});


// Configuration
  
app.configure(function(){  
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs'); 
  app.use(express.bodyParser()); 
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
}); 
 
// Routes

var eventService = new EventService(tableClient, blobClient);
app.get('/', eventService.showEvents.bind(eventService));
app.post('/events/create', eventService.newEvent.bind(eventService));
app.get('/events/:id', eventService.showEvent.bind(eventService))

app.listen(process.env.port || 1337);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
