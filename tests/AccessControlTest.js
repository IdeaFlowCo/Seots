const fetch = require('node-fetch')

var sessionid = undefined;

const apicall = (path,data,method) => {
  const headers = new fetch.Headers();
  headers.append('Content-Type', 'application/json');
  if(!!sessionid) {
    headers.append('Cookie', 'sessionid=' + sessionid );
  }

  return fetch('http://localhost:3003/api/v1/' + path,{
    method,
    credentials: 'include',
    body: method=='POST' ? JSON.stringify(data) : undefined,
    headers
  })
  .then((response) => {
    sessionid = sessionid || response.headers.get('set-cookie').split(';')[0].split('=')[1];
    return response.json()
  })
}

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
