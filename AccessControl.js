export const filter = (docs,sessiondata) => {
  return docs.filter((doc) => {
    if(!doc.acl) return true;
    if(doc.acl.owner == sessiondata.username) return true;
    if(doc.acl.readPermissions.users.indexOf(sessiondata.username) != -1) return true;
    if(doc.acl.readPermissions.public == true) return true;
    return false;
  })
};

export const addACLToDoc = (doc,sessiondata) => {
  const acl = {
    owner: sessiondata.username,
    readPermissions: {
      users: [],
      public: true
    }
  };
  return Object.assign({},doc,{acl});
};

export const addReadPermission = (doc,owner,username) => {
  if(!doc.acl || doc.acl.owner !== owner) return doc;
  const acl = Object.assign({},doc.acl,{
    readPermissions: doc.acl.concat([username])
  });
  return Object.assign({},doc,{acl});
};
