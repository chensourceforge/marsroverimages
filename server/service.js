const express = require('express');
const bodyParser = require('body-parser');
const service = express();
const request = require('superagent');
const token = '';
const urlManifests = 'https://api.nasa.gov/mars-photos/api/v1/manifests/';
const urlPhotos = 'https://api.nasa.gov/mars-photos/api/v1/rovers/';

service.use(bodyParser.json());
service.use(bodyParser.urlencoded({ extended: false }));

service.post('/service/mars', getMars);


function getLastSol(rover, camera){
    return new Promise((resolve, reject)=>{
        request.
        get(urlManifests + rover).
        query({api_key: token}).
        end((err, res)=>{
            if(err){return reject(err);}
            let photos = JSON.parse(res.text).photo_manifest.photos;

            if(camera){
                for(let i = photos.length - 1; i >= 0; i--){
                    if(photos[i].cameras.includes(camera.toUpperCase())){
                        return resolve(photos[i].sol);
                    }
                }
            }
            
            return resolve(photos[photos.length - 1].sol);
        });
    });
}

function getPhotos(rover, camera, sol){
    return new Promise((resolve, reject)=>{
        request.
            get(urlPhotos + rover + '/photos').
            query({
                sol: sol,
                camera: camera,
                api_key: token
            }).
            end((err, res)=>{
                if(err){return reject(err);}
                let results = [];
                let photos = JSON.parse(res.text).photos;
                if(photos){
                    for(let p of photos){
                        results.push({
                            earth_date: p.earth_date,
                            camera: p.camera.full_name,
                            img_src: p.img_src
                        });
                    }
                }
                return resolve(results);
            });
    });
}

function process(entities) {
    let rover = 'curiosity';
    let camera;
    if(entities.rover && entities.rover[0] && entities.rover[0].value){
        rover = entities.rover[0].value;
    }
    if(entities.camera && entities.camera[0] && entities.camera[0].value){
        camera = entities.camera[0].value;
    }

    return getLastSol(rover, camera).
        then((sol)=>{return getPhotos(rover, camera, sol);});
}


function getMars(req, res){
    process(req.body).
    then((stuff) => {
        res.json(stuff);
    }, (error) => {
        res.json(error);
    });
}


module.exports = service;