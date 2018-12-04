const os = require('os');
const path = require('path');
const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage');

// config
// const storage = new Storage({
//      projectId: '', 
//      keyFilename: ''
// });

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


exports.onImageUpload = functions.storage.bucket("cloud-functions-basics.appspot.com").object().onFinalize(event => {
    console.log(event);

    // getting the file attributes

    const fileBucket = object.bucket;
    const objContentType = object.ContentType;
    const filePath = object.filePath;
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
        console.log("Image downloaded to the local destination");
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

