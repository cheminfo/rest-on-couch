

In order to debug the importation you should go in the docker import image. You can find the id of the image using `docker ps`

`docker exec -it DOCKER_ID sh`

You can then even test an errored file from the docker image

`node bin/rest-on-couch-import.js  --dry-run /rest-on-couch/eln/nmr/errored/2017/08/28/Test_F1_26d9c7
6e1f2bfad5114777e55a6a5f2d.jdx  eln nmr`

