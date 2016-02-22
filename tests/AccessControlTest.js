var apicall = require('./apicall').apicall

Promise.resolve()
  .then(() => {
    return apicall('auth/register',{username:'testu',password:'testp'},"POST")
  })
  .then((data) => {
    console.log(data);
  })
  .then(() => {
    return apicall('auth/login',{username:'testu',password:'testp'},"POST")
  })
  .then((data) => {
    console.log(data);
  })
  .then(() => {
    return apicall('auth/login',{username:'testu',password:'testp'},"POST")
  })
  .then((data) => {
    console.log(data);
  })
  .then(() => {
    return apicall('auth/sessiondata',{},"GET")
  })
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.log(error,error.stack)
  })
