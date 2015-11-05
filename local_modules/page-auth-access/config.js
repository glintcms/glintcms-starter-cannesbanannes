exports.rules = [
  [['POST', 'PUT', 'DELETE'], '/*/glint/role/*', 'manage'],
  [['POST', 'PUT', 'DELETE'], '/*/glint/config/*', 'manage'],
  [['GET'], '/signup/*', 'manage'],
  ['*', '/signin/*', 'manage'],
  ['*', '/upload/*', 'edit'],
  ['GET', '/translate/*', 'edit,manage'],
  ['GET', '/filemanager/*', 'edit,manage'],
  [['POST', 'PUT', 'DELETE'], '/filemanager/*', 'edit,manage'],
  ['GET', '/ajax/*', '*'],
  ['POST,DELETE,PUT', '/ajax/*', 'edit,insert,delete'],
  ['*', '/admin/*', 'manage'],
  [['GET', 'POST'], '/*', '*']
];

exports.userProperty = 'user';

exports.roleProperty = 'userRole';

exports.roleStringProperty = 'userRoleString';

exports.permissionProperty = 'userPermission';

