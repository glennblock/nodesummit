var azure = require('./../../lib/azure')
  , uuid = require('node-uuid')
  , ServiceClient = azure.ServiceClient;
module.exports = PushpinService;

var TABLE_NAME = 'pushpins';
var CONTAINER_NAME = 'pushpins';

function PushpinService(tableClient, blobClient) {
  this.tableClient = tableClient;
  this.blobClient = blobClient;
};

PushpinService.createPushpinService = function (callback) {

  //var tableClient = azure.createTableService(ServiceClient.DEVSTORE_STORAGE_ACCOUNT, ServiceClient.DEVSTORE_STORAGE_ACCESS_KEY, ServiceClient.DEVSTORE_TABLE_HOST); 
  //var blobClient = azure.createBlobService(azure.ServiceClient.DEVSTORE_STORAGE_ACCOUNT, azure.ServiceClient.DEVSTORE_STORAGE_ACCESS_KEY, azure.ServiceClient.DEVSTORE_BLOB_HOST).withFilter(new azure.ExponentialRetryPolicyFilter());

  var tableClient = azure.createTableService("nodesummitworkshop", "Ta+1p/19QrOPbsRl0eNzGyxd7Ths0Qp2qpNyob8FyERIBhzbsFtPgn70RdAmrUJsDrYbTX2DJwEzZ8syRNw/Xg==");
  var blobClient = azure.createBlobService("nodesummitworkshop", "Ta+1p/19QrOPbsRl0eNzGyxd7Ths0Qp2qpNyob8FyERIBhzbsFtPgn70RdAmrUJsDrYbTX2DJwEzZ8syRNw/Xg==");

  var pushpinService = new PushpinService(tableClient, blobClient);

  // create table if it doesnt exist
  tableClient.createTableIfNotExists(TABLE_NAME, function (error) {
    if (error) {
      throw error;
    } else {
      // create blob container if it doesnt exist
      blobClient.createContainerIfNotExists(CONTAINER_NAME, function (error2) {
        if (error2) {
          throw error2;
        } else {
          // set blob container public
          blobClient.setContainerAcl(CONTAINER_NAME, azure.Constants.BlobConstants.BlobContainerPublicAccessType.BLOB, function (error1) {
            if (error1) {
              throw error1;
            } else {
              callback(pushpinService);
            }
          });
        }
      });
    }
  });
};

PushpinService.prototype = {
  showPushpins: function (req, res) {
    res.render('index');
  },

  getPushpins: function (callback) {
    var self = this;

    var tableQuery = azure.TableQuery
      .select()
      .from(TABLE_NAME);

    self.tableClient.queryEntities(tableQuery, function (err, pushpins) {
      for (var i = 0; i < pushpins.length; i++) {
        pushpins[i].imageUrl = self.blobClient.getBlobUrl(CONTAINER_NAME, pushpins[i].RowKey).url();
      }

      callback(err, pushpins);
    });
  },

  clearPushpins: function (callback) {
    var self = this;
    var tableQuery = azure.TableQuery
      .select()
      .from(TABLE_NAME);

    self.tableClient.queryEntities(tableQuery, function (err, entities) {
      for (var entity in entities) {
        self.tableClient.deleteEntity(TABLE_NAME, entities[entity], callback);
      }
    });
  },

  newPushpin: function (req, res) {
    var self = this;

    var createPushpin = function () {
      var pushpin = req.body;
      pushpin.RowKey = uuid();
      pushpin.PartitionKey = 'locations';

      self.tableClient.insertEntity(TABLE_NAME, pushpin, function (error) {
        if (error) {
          console.log(error);
          throw error;
        }

        console.log('pushpin created, uploading photo.');
        var options = {
          contentType: req.files.pushpinFile.type,
          metadata: { fileName: pushpin.RowKey }
        };

        self.blobClient.createBlockBlobFromFile(CONTAINER_NAME, pushpin.RowKey, req.files.pushpinFile.path, options, function (error1, blockBlob) {
          if (error1) {
            throw error;
          } else {
            console.log(JSON.stringify(blockBlob));
            res.redirect('/');
          }
        });
      });
    };

    createPushpin();
  }
};