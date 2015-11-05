# page-auth-access

# note

> This Module is part of [glintcms](http://glintcms.com/).
> Please see the [documentation](https://github.com/glintcms/glintcms) for more info.

This is a Role based Authorization Module (or Role Based Access Control aka RBAC).

 > Authorization refers to rules that determine who is allowed to do what. E.g. Adam may be authorized to create and delete databases, while Usama is only authorised to read.

it lets you:
 - define roles
 - define permissions
 - assign roles to permissions
 - assign user to roles


this gives us the following model:
 ```
      1  n      1  n
 user ---- role ---- permission
 ```


## usage
TODO

## usage notes
 - `wrap-layout` it depends on `wrap-layout`, but doesn't have it declared as `dependencies`.



## example definitions

userX.role = 'blogger,translator'

roles: ['admin:super', 'admin', 'editor', 'blogger', 'translator']

permissions: ['view', 'edit', 'edit:blog', 'edit:page', 'add', 'remove', 'manage']

grant: {
    superadmin : '*',
    admin: '*,-manage',
    editor: 'view,edit:*,add,remove',
    blogger: 'view,edit:blog,add'
}

## or

role

admin:super can admin
admin can editor

super:admin


# alternative: ressource based access control

var access = require('fort-knox')

access();

## api
#### access(methods, path, role)

example:
access(['GET', 'POST'], '/*/glint/role/*', 'admin:*')
access('POST', '/*/glint/*/*', 'edit:glint')


TODO implement where function
#### access(methods, path, role, where)

example with `where` function:
access(['GET', 'POST'], '/:org/glint/role/:id', 'admin:*', function(param){
    return (req.user.id === param.id && req.user.org === param.org);
});

example with `where` object:
access(['GET', 'POST'], '/:org/glint/role/*', 'admin:*', { org: req.user.org});


access.roles
-> saved roles

app.midleware
middleware function

example usage:
app.use(access.middleware())


