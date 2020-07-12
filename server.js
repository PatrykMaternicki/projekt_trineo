
var connect             = require('request');
var fs                  = require('fs');
var authToken = null;
var cameraId = null;
var userData = {
  password:'cloudleader', 
  username: 'demo@een.com'
};

getAuthtenticate().then(response => getUserData(response))
    .then(response => getImagesDataList(response))
    .then(response => getImages(response))

function getAuthtenticate() {
    return new Promise((resolve, reject) => {
        connect.post('https://login.eagleeyenetworks.com/g/aaa/authenticate', {form: userData}, (err, httpResponse, body) => {
            console.log('Loaded Auth Data');
            resolve(JSON.parse(body));
        });
    });
}

function getUserData(responseData) {
    return new Promise((resolve, reject) => {
        connect.post('https://login.eagleeyenetworks.com/g/aaa/authorize', {form:{token: responseData.token}}, (err, httpResponse, body) => {
            authToken = filterCookie( httpResponse.headers["set-cookie"], "auth_key");
            console.log('Loaded User Data');
            resolve(JSON.parse(body));
        });
    }); 
}


function filterCookie(cookies, key) {
  return cookies.find(cookie => cookie.includes(key)).split(";").find(row => row.includes(key)).split("=")[1];
}

function getRandomCamera(cameras) {
  let readableCameras = cameras.filter(camera => camera[1] === 'r');
  let randomIndexCamera = Math.floor(Math.random() * readableCameras.length);
  return readableCameras[randomIndexCamera][0];
}

function getImagesDataList(responseData) {
    cameraId =  getRandomCamera(responseData['camera_access']);
    const options = {
        url: `https://login.eagleeyenetworks.com/asset/list/image.jpeg?id=${cameraId}&start_timestamp=20180401000000.000&count=20&asset_class=all`,
        headers: {
          cookie: `auth_key=${authToken}`,
          'Content-Type': 'image/jpeg'
        },
      };
    
    return new Promise((resolve, reject) => {
        connect.get(options, (err, httpResponse, body) => {
            console.log('Loaded Image Data');
            resolve(JSON.parse(body));
        });
    });   
}

function getImages(imagesData) {
    console.log(imagesData.length);
    let promises = [];
    let generateNameDir = `${new Date().getMonth()}__${Date.now()}`
    if (!fs.existsSync(`${generateNameDir}`)){
      fs.mkdirSync(`${generateNameDir}`);
    }
    imagesData.forEach(imageData => {
      promises.push(new Promise(resolve => {
        const options = {
          url: `https://login.eagleeyenetworks.com/asset/next/image.jpeg?id=${cameraId}&timestamp=${imageData.s}&asset_class=thumb`,
          headers: {
            cookie: `auth_key=${authToken}`,
          },
        };
  
        setTimeout(() => {
          connect.get(options)
            .on('response', function(response) {
              console.log('File Loaded');
              console.log(response.statusCode);
              console.log(response.statusCode === 200 ? 'SUCCESS' : 'FAIL');
            })
            .pipe(fs.createWriteStream(`${generateNameDir}/${Date.now()}.jpeg`).on('close', () => resolve(true)))
        }, 10000)    
        }));
    });
    Promise.all(promises).then(() => console.log('finish'));
  }