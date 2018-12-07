const os = require('os');
const path = require('path');
const functions = require('firebase-functions');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors')({ origin: true});
const Busboy = require('busboy');
const fs = require('fs');

// config
const gcs = new Storage({
     projectId: 'cloud-functions-basics', 
     keyFilename: 'cloud-functions-basics-firebase-adminsdk-zafvq-716fab6d49.json'
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// storage trigger
exports.onImageUpload = functions.storage.bucket("cloud-functions-basics.appspot.com").object().onFinalize(event => {
    console.log(event);

    // getting the file attributes
    const fileBucket = event.bucket;
    const contentType = event.ContentType;
    const filePath = event.filePath;
    console.log('file changes detected!');

    // downloading the file & re-uploading after modification

    const destBucket = gcs.bucket(fileBucket);
    const tmpFilePath = path.join(os.tmpdir(), path.basename(filePath)); // path.basename returns filename
    const metaData = {
        contentType: contentType
    };

    return destBucket.file(filePath).download({
        destination : tmpFilePath,
    }).then(() => {
        destBucket.file(filePath).upload({
            destination: "renamed-" + path.basename(filePath), 
            metaData: metaData
        });
    });
});

exports.onImageDeletion = functions.storage.bucket("cloud-functions-basics.appspot.com").object().onDelete(event => {
    console.log(event);
});

// https trigger
exports.uploadFile = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
      if (req.method !== "POST") {
        return res.status(500).json({
          message: "Request is not allowed!"
        });
      }
      const busboy = new Busboy({ headers: req.headers });
      let uploadData = null;
  
      busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        const filepath = path.join(os.tmpdir(), filename);
        uploadData = { file: filepath, type: mimetype };
        file.pipe(fs.createWriteStream(filepath));
      });
  
      busboy.on("finish", () => {
        const bucket = gcs.bucket("cloud-functions-basics.appspot.com");
        bucket
          .upload(uploadData.file, {
            uploadType: "media",
            metadata: {
              metadata: {
                contentType: uploadData.type
              }
            }
          })
          .then(() => {
            res.status(200).json({
              message: "Upload was successfull!"
            });
          })
          .catch(err => {
            res.status(500).json({
              error: err
            });
          });
      });
      
      busboy.end(req.rawBody);
    });
  });
